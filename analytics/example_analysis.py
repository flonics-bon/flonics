import numpy as np
import pandas as pd

def analyze_flow_data(velocity_data):
    """
    4D Flow MRI 속도 데이터 분석
    
    Args:
        velocity_data: numpy array of velocity vectors
    
    Returns:
        dict: 분석 결과
    """
    mean_velocity = np.mean(velocity_data, axis=0)
    max_velocity = np.max(velocity_data)
    
    return {
        'mean_velocity': mean_velocity,
        'max_velocity': max_velocity
    }

if __name__ == '__main__':
    # Example usage
    sample_data = np.random.rand(100, 3)
    results = analyze_flow_data(sample_data)
    print(results)