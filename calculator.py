"""덧셈과 뺄셈 계산기 모듈

4D Flow MRI 데이터 처리 시 필요한 기본 산술 연산을 제공합니다.
"""

def add(a, b):
    """두 숫자를 더합니다.
    
    Args:
        a (float): 첫 번째 숫자
        b (float): 두 번째 숫자
    
    Returns:
        float: 두 숫자의 합
    """
    return a + b

def subtract(a, b):
    """두 숫자를 뺍니다.
    
    Args:
        a (float): 첫 번째 숫자 (피감수)
        b (float): 두 번째 숫자 (감수)
    
    Returns:
        float: 두 숫자의 차
    """
    return a - b

def main():
    """계산기 메인 함수"""
    print("=== 덧셈/뺄셈 계산기 ===")
    print(f"10 + 5 = {add(10, 5)}")
    print(f"10 - 5 = {subtract(10, 5)}")
    print(f"3.14 + 2.86 = {add(3.14, 2.86)}")
    print(f"100 - 37 = {subtract(100, 37)}")

if __name__ == "__main__":
    main()
