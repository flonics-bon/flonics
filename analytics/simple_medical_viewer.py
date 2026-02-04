"""
Simple Medical Image Viewer for 4D Flow MRI
Supports DICOM, NIfTI, and common image formats
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button
import pydicom
import nibabel as nib
from pathlib import Path
import os


class SimpleMedicalViewer:
    """간단한 의료 영상 뷰어"""
    
    def __init__(self, file_path):
        """
        Initialize viewer with medical image file
        
        Parameters:
        -----------
        file_path : str
            Path to medical image file (DICOM, NIfTI, etc.)
        """
        self.file_path = Path(file_path)
        self.data = None
        self.current_slice = 0
        self.current_time = 0
        
        # Load image data
        self._load_image()
        
    def _load_image(self):
        """Load medical image based on file extension"""
        ext = self.file_path.suffix.lower()
        
        if ext == '.dcm':
            self._load_dicom()
        elif ext in ['.nii', '.gz']:
            self._load_nifti()
        elif ext in ['.npy']:
            self._load_numpy()
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    
    def _load_dicom(self):
        """Load DICOM file"""
        try:
            dcm = pydicom.dcmread(self.file_path)
            self.data = dcm.pixel_array
            
            # Normalize to 0-1 range
            if self.data.max() > 0:
                self.data = self.data.astype(float) / self.data.max()
                
            # Ensure 3D or 4D
            if self.data.ndim == 2:
                self.data = self.data[np.newaxis, ...]
                
            print(f"DICOM loaded: {self.data.shape}")
            
        except Exception as e:
            raise ValueError(f"Error loading DICOM: {e}")
    
    def _load_nifti(self):
        """Load NIfTI file"""
        try:
            nii = nib.load(str(self.file_path))
            self.data = nii.get_fdata()
            
            # Normalize to 0-1 range
            if self.data.max() > 0:
                self.data = (self.data - self.data.min()) / (self.data.max() - self.data.min())
            
            print(f"NIfTI loaded: {self.data.shape}")
            
        except Exception as e:
            raise ValueError(f"Error loading NIfTI: {e}")
    
    def _load_numpy(self):
        """Load NumPy array file"""
        try:
            self.data = np.load(self.file_path)
            
            # Normalize to 0-1 range
            if self.data.max() > 0:
                self.data = (self.data - self.data.min()) / (self.data.max() - self.data.min())
            
            print(f"NumPy array loaded: {self.data.shape}")
            
        except Exception as e:
            raise ValueError(f"Error loading NumPy: {e}")
    
    def show(self):
        """Display interactive viewer"""
        if self.data is None:
            raise ValueError("No data loaded")
        
        # Handle different dimensions
        if self.data.ndim == 3:
            self._show_3d()
        elif self.data.ndim == 4:
            self._show_4d()
        else:
            raise ValueError(f"Unsupported data dimension: {self.data.ndim}D")
    
    def _show_3d(self):
        """Show 3D volume with slice navigation"""
        fig, ax = plt.subplots(figsize=(10, 8))
        plt.subplots_adjust(bottom=0.15)
        
        # Initial display
        img = ax.imshow(self.data[self.current_slice, :, :], cmap='gray')
        ax.set_title(f'Slice: {self.current_slice + 1}/{self.data.shape[0]}')
        plt.colorbar(img, ax=ax)
        
        # Slider for slice navigation
        ax_slice = plt.axes([0.2, 0.05, 0.6, 0.03])
        slider_slice = Slider(
            ax_slice, 'Slice', 
            0, self.data.shape[0] - 1, 
            valinit=self.current_slice, 
            valstep=1
        )
        
        def update(val):
            self.current_slice = int(slider_slice.val)
            img.set_data(self.data[self.current_slice, :, :])
            ax.set_title(f'Slice: {self.current_slice + 1}/{self.data.shape[0]}')
            fig.canvas.draw_idle()
        
        slider_slice.on_changed(update)
        
        # Add statistics text
        stats_text = (
            f"Shape: {self.data.shape}\n"
            f"Min: {self.data.min():.4f}\n"
            f"Max: {self.data.max():.4f}\n"
            f"Mean: {self.data.mean():.4f}"
        )
        plt.figtext(0.02, 0.85, stats_text, fontsize=9, 
                   bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.show()
    
    def _show_4d(self):
        """Show 4D volume with slice and time navigation (for 4D Flow MRI)"""
        fig, ax = plt.subplots(figsize=(12, 8))
        plt.subplots_adjust(bottom=0.2)
        
        # Initial display
        img = ax.imshow(self.data[self.current_slice, :, :, self.current_time], cmap='gray')
        ax.set_title(
            f'Slice: {self.current_slice + 1}/{self.data.shape[0]} | '
            f'Time: {self.current_time + 1}/{self.data.shape[3]}'
        )
        plt.colorbar(img, ax=ax)
        
        # Slider for slice navigation
        ax_slice = plt.axes([0.2, 0.1, 0.6, 0.03])
        slider_slice = Slider(
            ax_slice, 'Slice', 
            0, self.data.shape[0] - 1, 
            valinit=self.current_slice, 
            valstep=1
        )
        
        # Slider for time navigation
        ax_time = plt.axes([0.2, 0.05, 0.6, 0.03])
        slider_time = Slider(
            ax_time, 'Time', 
            0, self.data.shape[3] - 1, 
            valinit=self.current_time, 
            valstep=1
        )
        
        def update(val):
            self.current_slice = int(slider_slice.val)
            self.current_time = int(slider_time.val)
            img.set_data(self.data[self.current_slice, :, :, self.current_time])
            ax.set_title(
                f'Slice: {self.current_slice + 1}/{self.data.shape[0]} | '
                f'Time: {self.current_time + 1}/{self.data.shape[3]}'
            )
            fig.canvas.draw_idle()
        
        slider_slice.on_changed(update)
        slider_time.on_changed(update)
        
        # Add statistics text
        current_slice_data = self.data[self.current_slice, :, :, self.current_time]
        stats_text = (
            f"4D Flow MRI Data\n"
            f"Shape: {self.data.shape}\n"
            f"Current slice Min: {current_slice_data.min():.4f}\n"
            f"Current slice Max: {current_slice_data.max():.4f}\n"
            f"Current slice Mean: {current_slice_data.mean():.4f}"
        )
        plt.figtext(0.02, 0.80, stats_text, fontsize=9, 
                   bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.5))
        
        plt.show()
    
    def save_slice(self, output_path, slice_idx=None, time_idx=None):
        """
        Save a specific slice to file
        
        Parameters:
        -----------
        output_path : str
            Output file path
        slice_idx : int, optional
            Slice index (default: current slice)
        time_idx : int, optional
            Time index for 4D data (default: current time)
        """
        if slice_idx is None:
            slice_idx = self.current_slice
        
        if self.data.ndim == 4:
            if time_idx is None:
                time_idx = self.current_time
            slice_data = self.data[slice_idx, :, :, time_idx]
        else:
            slice_data = self.data[slice_idx, :, :]
        
        plt.imsave(output_path, slice_data, cmap='gray')
        print(f"Slice saved to: {output_path}")


def main():
    """Example usage"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simple_medical_viewer.py <path_to_medical_image>")
        print("\nSupported formats:")
        print("  - DICOM (.dcm)")
        print("  - NIfTI (.nii, .nii.gz)")
        print("  - NumPy array (.npy)")
        print("\nExample:")
        print("  python simple_medical_viewer.py data/sample.nii.gz")
        return
    
    file_path = sys.argv[1]
    
    try:
        viewer = SimpleMedicalViewer(file_path)
        print(f"\nData shape: {viewer.data.shape}")
        print(f"Data type: {viewer.data.dtype}")
        print(f"Data range: [{viewer.data.min():.4f}, {viewer.data.max():.4f}]")
        print("\nOpening viewer...")
        viewer.show()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
