import torch
import torch.nn as nn
import torch.nn.functional as F


class DoubleConv(nn.Module):
    """Double convolution block: (Conv3D -> BatchNorm -> ReLU) * 2"""
    
    def __init__(self, in_channels, out_channels, mid_channels=None):
        super().__init__()
        if not mid_channels:
            mid_channels = out_channels
        
        self.double_conv = nn.Sequential(
            nn.Conv3d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm3d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv3d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm3d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def forward(self, x):
        return self.double_conv(x)


class Down(nn.Module):
    """Downscaling with maxpool then double conv"""
    
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool3d(2),
            DoubleConv(in_channels, out_channels)
        )
    
    def forward(self, x):
        return self.maxpool_conv(x)


class Up(nn.Module):
    """Upscaling then double conv"""
    
    def __init__(self, in_channels, out_channels, trilinear=True):
        super().__init__()
        
        if trilinear:
            self.up = nn.Upsample(scale_factor=2, mode='trilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose3d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)
    
    def forward(self, x1, x2):
        x1 = self.up(x1)
        
        # Input: (N, C, D, H, W)
        diff_d = x2.size()[2] - x1.size()[2]
        diff_h = x2.size()[3] - x1.size()[3]
        diff_w = x2.size()[4] - x1.size()[4]
        
        x1 = F.pad(x1, [
            diff_w // 2, diff_w - diff_w // 2,
            diff_h // 2, diff_h - diff_h // 2,
            diff_d // 2, diff_d - diff_d // 2
        ])
        
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    """Final output convolution"""
    
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Conv3d(in_channels, out_channels, kernel_size=1)
    
    def forward(self, x):
        return self.conv(x)


class UNet3D(nn.Module):
    """3D U-Net for 4D Flow MRI analysis
    
    Args:
        n_channels: Number of input channels (e.g., 4 for velocity components + magnitude)
        n_classes: Number of output classes/channels
        base_channels: Number of channels in the first layer
        trilinear: Use trilinear upsampling instead of transpose convolution
    """
    
    def __init__(self, n_channels=4, n_classes=3, base_channels=64, trilinear=True):
        super().__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        self.trilinear = trilinear
        
        # Encoder
        self.inc = DoubleConv(n_channels, base_channels)
        self.down1 = Down(base_channels, base_channels * 2)
        self.down2 = Down(base_channels * 2, base_channels * 4)
        self.down3 = Down(base_channels * 4, base_channels * 8)
        factor = 2 if trilinear else 1
        self.down4 = Down(base_channels * 8, base_channels * 16 // factor)
        
        # Decoder
        self.up1 = Up(base_channels * 16, base_channels * 8 // factor, trilinear)
        self.up2 = Up(base_channels * 8, base_channels * 4 // factor, trilinear)
        self.up3 = Up(base_channels * 4, base_channels * 2 // factor, trilinear)
        self.up4 = Up(base_channels * 2, base_channels, trilinear)
        self.outc = OutConv(base_channels, n_classes)
    
    def forward(self, x):
        # Encoder
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        
        # Decoder with skip connections
        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        logits = self.outc(x)
        
        return logits
    
    def get_num_parameters(self):
        """Returns the total number of parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


class UNet2D(nn.Module):
    """2D U-Net for slice-based analysis
    
    Args:
        n_channels: Number of input channels
        n_classes: Number of output classes/channels
        base_channels: Number of channels in the first layer
        bilinear: Use bilinear upsampling instead of transpose convolution
    """
    
    def __init__(self, n_channels=4, n_classes=3, base_channels=64, bilinear=True):
        super().__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        self.bilinear = bilinear
        
        # Replace Conv3d with Conv2d, MaxPool3d with MaxPool2d
        self.inc = self._double_conv_2d(n_channels, base_channels)
        self.down1 = self._down_2d(base_channels, base_channels * 2)
        self.down2 = self._down_2d(base_channels * 2, base_channels * 4)
        self.down3 = self._down_2d(base_channels * 4, base_channels * 8)
        factor = 2 if bilinear else 1
        self.down4 = self._down_2d(base_channels * 8, base_channels * 16 // factor)
        
        self.up1 = self._up_2d(base_channels * 16, base_channels * 8 // factor, bilinear)
        self.up2 = self._up_2d(base_channels * 8, base_channels * 4 // factor, bilinear)
        self.up3 = self._up_2d(base_channels * 4, base_channels * 2 // factor, bilinear)
        self.up4 = self._up_2d(base_channels * 2, base_channels, bilinear)
        self.outc = nn.Conv2d(base_channels, n_classes, kernel_size=1)
    
    def _double_conv_2d(self, in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )
    
    def _down_2d(self, in_ch, out_ch):
        return nn.Sequential(
            nn.MaxPool2d(2),
            self._double_conv_2d(in_ch, out_ch)
        )
    
    def _up_2d(self, in_ch, out_ch, bilinear):
        if bilinear:
            return nn.Sequential(
                nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True),
                self._double_conv_2d(in_ch, out_ch)
            )
        else:
            return nn.Sequential(
                nn.ConvTranspose2d(in_ch, in_ch // 2, 2, stride=2),
                self._double_conv_2d(in_ch, out_ch)
            )
    
    def forward(self, x):
        # Simplified 2D forward pass
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        
        x = self.up1(x5)
        x = self.up2(x)
        x = self.up3(x)
        x = self.up4(x)
        logits = self.outc(x)
        
        return logits