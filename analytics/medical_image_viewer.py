#!/usr/bin/env python3
"""
Medical Image Viewer
Simple Python script to view medical imaging files (DICOM, NIfTI)
Supports 4D Flow MRI data visualization
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import argparse


def load_dicom(file_path):
    """Load DICOM file using pydicom"""
    try:
        import pydicom
        dcm = pydicom.dcmread(file_path)
        image = dcm.pixel_array
        return image, dcm
    except ImportError:
        print("Error: pydicom not installed. Install with: pip install pydicom")
        return None, None
    except Exception as e:
        print(f"Error loading DICOM: {e}")
        return None, None


def load_nifti(file_path):
    """Load NIfTI file using nibabel"""
    try:
        import nibabel as nib
        nii = nib.load(file_path)
        image = nii.get_fdata()
        return image, nii
    except ImportError:
        print("Error: nibabel not installed. Install with: pip install nibabel")
        return None, None
    except Exception as e:
        print(f"Error loading NIfTI: {e}")
        return None, None


def view_2d_image(image, title="Medical Image", cmap='gray'):
    """Display 2D medical image"""
    plt.figure(figsize=(10, 10))
    plt.imshow(image, cmap=cmap)
    plt.colorbar()
    plt.title(title)
    plt.axis('off')
    plt.tight_layout()
    plt.show()


def view_3d_slices(volume, slice_axis=2, title="3D Medical Image"):
    """Display multiple slices from 3D volume"""
    if len(volume.shape) < 3:
        print("Error: Volume must be 3D or higher")
        return
    
    # Get the middle slice along the specified axis
    if slice_axis == 0:
        mid_slice = volume.shape[0] // 2
        slices = [
            volume[mid_slice - 2, :, :],
            volume[mid_slice - 1, :, :],
            volume[mid_slice, :, :],
            volume[mid_slice + 1, :, :],
            volume[mid_slice + 2, :, :]
        ]
        axis_name = "Sagittal"
    elif slice_axis == 1:
        mid_slice = volume.shape[1] // 2
        slices = [
            volume[:, mid_slice - 2, :],
            volume[:, mid_slice - 1, :],
            volume[:, mid_slice, :],
            volume[:, mid_slice + 1, :],
            volume[:, mid_slice + 2, :]
        ]
        axis_name = "Coronal"
    else:  # axis == 2
        mid_slice = volume.shape[2] // 2
        slices = [
            volume[:, :, mid_slice - 2],
            volume[:, :, mid_slice - 1],
            volume[:, :, mid_slice],
            volume[:, :, mid_slice + 1],
            volume[:, :, mid_slice + 2]
        ]
        axis_name = "Axial"
    
    fig, axes = plt.subplots(1, 5, figsize=(20, 4))
    fig.suptitle(f"{title} - {axis_name} View", fontsize=16)
    
    for idx, (ax, slice_img) in enumerate(zip(axes, slices)):
        ax.imshow(slice_img, cmap='gray')
        ax.set_title(f"Slice {mid_slice - 2 + idx}")
        ax.axis('off')
    
    plt.tight_layout()
    plt.show()


def view_4d_flow(volume_4d, time_point=0, component=0):
    """
    Display 4D Flow MRI data
    volume_4d: 4D array (x, y, z, time/velocity_components)
    time_point: which time point to display
    component: velocity component (0=Vx, 1=Vy, 2=Vz)
    """
    if len(volume_4d.shape) != 4:
        print("Error: Volume must be 4D for flow visualization")
        return
    
    # Extract 3D volume at specific time point
    volume_3d = volume_4d[:, :, :, time_point]
    
    mid_x = volume_3d.shape[0] // 2
    mid_y = volume_3d.shape[1] // 2
    mid_z = volume_3d.shape[2] // 2
    
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.suptitle(f"4D Flow MRI - Time/Component: {time_point}", fontsize=16)
    
    # Sagittal view
    axes[0].imshow(volume_3d[mid_x, :, :], cmap='viridis')
    axes[0].set_title(f"Sagittal (x={mid_x})")
    axes[0].axis('off')
    
    # Coronal view
    axes[1].imshow(volume_3d[:, mid_y, :], cmap='viridis')
    axes[1].set_title(f"Coronal (y={mid_y})")
    axes[1].axis('off')
    
    # Axial view
    axes[2].imshow(volume_3d[:, :, mid_z], cmap='viridis')
    axes[2].set_title(f"Axial (z={mid_z})")
    axes[2].axis('off')
    
    plt.tight_layout()
    plt.show()


def interactive_slice_viewer(volume):
    """Interactive slice viewer with keyboard navigation"""
    if len(volume.shape) < 3:
        print("Error: Volume must be 3D or higher")
        return
    
    fig, ax = plt.subplots(figsize=(10, 10))
    
    current_slice = volume.shape[2] // 2
    
    def update_slice(slice_idx):
        ax.clear()
        ax.imshow(volume[:, :, slice_idx], cmap='gray')
        ax.set_title(f"Slice {slice_idx}/{volume.shape[2]-1}")
        ax.axis('off')
        fig.canvas.draw()
    
    def on_key(event):
        nonlocal current_slice
        if event.key == 'up' or event.key == 'right':
            current_slice = min(current_slice + 1, volume.shape[2] - 1)
            update_slice(current_slice)
        elif event.key == 'down' or event.key == 'left':
            current_slice = max(current_slice - 1, 0)
            update_slice(current_slice)
    
    fig.canvas.mpl_connect('key_press_event', on_key)
    update_slice(current_slice)
    
    print("Use arrow keys (up/down or left/right) to navigate slices")
    plt.show()


def main():
    parser = argparse.ArgumentParser(description='Medical Image Viewer')
    parser.add_argument('file_path', type=str, help='Path to medical image file')
    parser.add_argument('--interactive', action='store_true', 
                       help='Enable interactive slice viewer')
    parser.add_argument('--axis', type=int, default=2, choices=[0, 1, 2],
                       help='Slice axis for 3D viewing (0=sagittal, 1=coronal, 2=axial)')
    parser.add_argument('--flow', action='store_true',
                       help='View as 4D Flow MRI data')
    parser.add_argument('--timepoint', type=int, default=0,
                       help='Time point for 4D Flow visualization')
    
    args = parser.parse_args()
    
    file_path = Path(args.file_path)
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return
    
    # Load image based on file extension
    image = None
    metadata = None
    
    if file_path.suffix.lower() in ['.dcm', '.dicom']:
        image, metadata = load_dicom(file_path)
    elif file_path.suffix.lower() in ['.nii', '.gz']:
        image, metadata = load_nifti(file_path)
    else:
        print(f"Unsupported file format: {file_path.suffix}")
        print("Supported formats: .dcm, .dicom, .nii, .nii.gz")
        return
    
    if image is None:
        print("Failed to load image")
        return
    
    print(f"Image shape: {image.shape}")
    print(f"Image dtype: {image.dtype}")
    print(f"Image range: [{np.min(image)}, {np.max(image)}]")
    
    # Display image based on dimensions
    if len(image.shape) == 2:
        view_2d_image(image, title=f"2D Medical Image: {file_path.name}")
    elif len(image.shape) == 3:
        if args.interactive:
            interactive_slice_viewer(image)
        else:
            view_3d_slices(image, slice_axis=args.axis, 
                          title=f"3D Medical Image: {file_path.name}")
    elif len(image.shape) == 4:
        if args.flow:
            view_4d_flow(image, time_point=args.timepoint)
        else:
            print("4D data detected. Use --flow flag for 4D Flow MRI visualization")
            # Show first volume
            view_3d_slices(image[:, :, :, 0], slice_axis=args.axis,
                          title=f"4D Medical Image (t=0): {file_path.name}")
    else:
        print(f"Unsupported image dimensions: {image.shape}")


if __name__ == "__main__":
    main()
