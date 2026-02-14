def print_triangle(n):
    for i in range(1, n + 1):
        print('*' * i)

def print_reverse_triangle(n):
    for i in range(n, 0, -1):
        print('*' * i)

def print_pyramid(n):
    for i in range(1, n + 1):
        print(' ' * (n - i) + '*' * (2 * i - 1))

def print_diamond(n):
    for i in range(1, n + 1):
        print(' ' * (n - i) + '*' * (2 * i - 1))
    for i in range(n - 1, 0, -1):
        print(' ' * (n - i) + '*' * (2 * i - 1))

def print_square(n):
    for i in range(n):
        print('*' * n)

if __name__ == '__main__':
    size = 5
    print('Triangle:')
    print_triangle(size)
    print('\nReverse Triangle:')
    print_reverse_triangle(size)
    print('\nPyramid:')
    print_pyramid(size)
    print('\nDiamond:')
    print_diamond(size)
    print('\nSquare:')
    print_square(size)