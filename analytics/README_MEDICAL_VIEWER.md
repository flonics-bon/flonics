# Medical Image Viewer

A Python-based medical image viewer for DICOM and NIfTI formats, with support for 4D Flow MRI data visualization.

## Features

- **DICOM Support**: Load and view DICOM medical images
- **NIfTI Support**: Load and view NIfTI (.nii, .nii.gz) files
- **2D Image Viewing**: Display single 2D medical images
- **3D Volume Viewing**: Display multiple slices from 3D volumes (Sagittal, Coronal, Axial views)
- **4D Flow MRI**: Specialized visualization for 4D Flow MRI data
- **Interactive Mode**: Navigate through slices using arrow keys

## Installation

```bash
cd analytics
pip install -r requirements.txt
```

Required packages:
- numpy
- matplotlib
- pydicom (for DICOM files)
- nibabel (for NIfTI files)

## Usage

### Basic Usage

```bash
# View a DICOM file
python medical_image_viewer.py path/to/image.dcm

# View a NIfTI file
python medical_image_viewer.py path/to/image.nii
```

### 3D Volume Viewing

```bash
# View axial slices (default)
python medical_image_viewer.py path/to/volume.nii

# View sagittal slices
python medical_image_viewer.py path/to/volume.nii --axis 0

# View coronal slices
python medical_image_viewer.py path/to/volume.nii --axis 1
```

### Interactive Mode

```bash
# Enable interactive slice navigation
python medical_image_viewer.py path/to/volume.nii --interactive
```

Use arrow keys (up/down or left/right) to navigate through slices.

### 4D Flow MRI Visualization

```bash
# View 4D Flow MRI data at time point 0
python medical_image_viewer.py path/to/4dflow.nii --flow

# View specific time point
python medical_image_viewer.py path/to/4dflow.nii --flow --timepoint 5
```

## Command Line Arguments

- `file_path`: Path to the medical image file (required)
- `--interactive`: Enable interactive slice viewer with keyboard navigation
- `--axis`: Slice axis for 3D viewing
  - `0`: Sagittal view
  - `1`: Coronal view
  - `2`: Axial view (default)
- `--flow`: Enable 4D Flow MRI visualization mode
- `--timepoint`: Specify time point for 4D Flow visualization (default: 0)

## Supported Formats

- **DICOM**: `.dcm`, `.dicom`
- **NIfTI**: `.nii`, `.nii.gz`

## Examples

### Example 1: View 2D X-ray
```bash
python medical_image_viewer.py xray.dcm
```

### Example 2: View 3D CT Scan
```bash
python medical_image_viewer.py ct_scan.nii --axis 2
```

### Example 3: Interactive MRI Navigation
```bash
python medical_image_viewer.py mri_brain.nii --interactive
```

### Example 4: 4D Flow MRI Cardiac Analysis
```bash
python medical_image_viewer.py cardiac_4dflow.nii --flow --timepoint 10
```

## Technical Details

### Image Display
- 2D images are displayed with grayscale colormap
- 3D volumes show 5 consecutive slices around the middle
- 4D Flow data uses viridis colormap for velocity visualization

### Coordinate System
- X-axis: Sagittal plane (left-right)
- Y-axis: Coronal plane (anterior-posterior)
- Z-axis: Axial plane (superior-inferior)

## Notes

- Ensure sufficient memory for large 4D datasets
- DICOM metadata is loaded but not displayed in basic mode
- For 4D Flow MRI, the tool assumes format: (x, y, z, time/component)

## Future Enhancements

- [ ] Add windowing (contrast/brightness) controls
- [ ] Support for velocity vector visualization
- [ ] Streamline visualization for flow data
- [ ] Multi-planar reconstruction (MPR)
- [ ] DICOM metadata viewer
- [ ] Export capabilities
- [ ] WebGPU-based 3D rendering

## License

This tool is part of the Flonics 4D Flow MRI analysis platform.
