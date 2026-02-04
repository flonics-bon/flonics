# Simple Medical Image Viewer

간단하고 사용하기 쉬운 의료 영상 뷰어입니다. DICOM, NIfTI 등 다양한 의료 영상 포맷을 지원합니다.

## Features

- **다양한 포맷 지원**
  - DICOM (.dcm)
  - NIfTI (.nii, .nii.gz)
  - NumPy array (.npy)

- **3D/4D 영상 지원**
  - 3D 볼륨 슬라이스 네비게이션
  - 4D Flow MRI 시간축 네비게이션

- **인터랙티브 UI**
  - Matplotlib 기반 슬라이더 컨트롤
  - 실시간 슬라이스/타임 포인트 변경
  - 통계 정보 표시 (Min, Max, Mean)

- **영상 저장 기능**
  - 특정 슬라이스 PNG/JPG로 저장

## Requirements

```bash
pip install numpy matplotlib pydicom nibabel
```

또는:

```bash
pip install -r requirements.txt
```

## Usage

### 기본 사용법

```bash
python simple_medical_viewer.py <path_to_medical_image>
```

### Examples

#### DICOM 파일 열기
```bash
python simple_medical_viewer.py data/sample.dcm
```

#### NIfTI 파일 열기
```bash
python simple_medical_viewer.py data/brain_mri.nii.gz
```

#### NumPy 배열 열기
```bash
python simple_medical_viewer.py data/volume.npy
```

### Python 코드에서 사용

```python
from simple_medical_viewer import SimpleMedicalViewer

# 뷰어 생성
viewer = SimpleMedicalViewer('data/sample.nii.gz')

# 데이터 정보 확인
print(f"Shape: {viewer.data.shape}")
print(f"Data range: [{viewer.data.min()}, {viewer.data.max()}]")

# 인터랙티브 뷰어 실행
viewer.show()

# 특정 슬라이스 저장
viewer.save_slice('output.png', slice_idx=50, time_idx=0)
```

## Controls

### 3D Volume
- **Slice Slider**: 슬라이스 인덱스 변경 (Z축)
- 왼쪽 상단에 통계 정보 표시

### 4D Flow MRI
- **Slice Slider**: 슬라이스 인덱스 변경 (Z축)
- **Time Slider**: 시간 프레임 변경 (T축)
- 왼쪽 상단에 현재 슬라이스 통계 정보 표시

## Data Format

### 입력 데이터 구조
- **3D**: `(slices, height, width)`
- **4D**: `(slices, height, width, time_frames)`

### 자동 정규화
- 모든 데이터는 자동으로 0-1 범위로 정규화됩니다
- DICOM: pixel_array를 최대값으로 나눔
- NIfTI: min-max 정규화
- NumPy: min-max 정규화

## Example: 4D Flow MRI 데이터 생성 및 시각화

```python
import numpy as np
from simple_medical_viewer import SimpleMedicalViewer

# 4D Flow MRI 더미 데이터 생성
slices = 30
height = 128
width = 128
time_frames = 20

# 시뮬레이션 데이터 (예: 혈류 velocity)
data_4d = np.random.rand(slices, height, width, time_frames)

# 중앙에 혈관 같은 구조 추가
for t in range(time_frames):
    phase = 2 * np.pi * t / time_frames
    for z in range(slices):
        y, x = np.ogrid[:height, :width]
        mask = ((x - 64)**2 + (y - 64)**2) < (20 + 10*np.sin(phase))**2
        data_4d[z, mask, t] += 0.5

# 저장
np.save('flow_data_4d.npy', data_4d)

# 시각화
viewer = SimpleMedicalViewer('flow_data_4d.npy')
viewer.show()
```

## Troubleshooting

### ImportError: No module named 'pydicom'
```bash
pip install pydicom
```

### ImportError: No module named 'nibabel'
```bash
pip install nibabel
```

### 그래프가 표시되지 않을 때
- GUI 백엔드 설정 확인:
```python
import matplotlib
matplotlib.use('TkAgg')  # 또는 'Qt5Agg'
```

## Advanced Usage

### 커스텀 Colormap 사용

```python
import matplotlib.pyplot as plt
from simple_medical_viewer import SimpleMedicalViewer

viewer = SimpleMedicalViewer('data/sample.nii.gz')

# _show_3d 또는 _show_4d 메서드를 수정하여 cmap 변경
# cmap='gray' -> cmap='jet', 'viridis', 'hot' 등
```

### 여러 슬라이스 일괄 저장

```python
viewer = SimpleMedicalViewer('data/volume.nii.gz')

for i in range(0, viewer.data.shape[0], 5):
    viewer.save_slice(f'slices/slice_{i:03d}.png', slice_idx=i)
```

## License

MIT License

## Contact

For questions or issues, please contact: bonbi0604@flonics.co.kr
