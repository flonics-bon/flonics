# CMakeLists.txt for 20단 구구단 프로그램
cmake_minimum_required(VERSION 3.10)

# 프로젝트 이름 및 버전
project(Gugudan20 VERSION 1.0 LANGUAGES CXX)

# C++ 표준 설정
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 실행 파일 생성
add_executable(gugudan20 gugudan.cpp)

# 컴파일 옵션 (경고 활성화)
if(MSVC)
    target_compile_options(gugudan20 PRIVATE /W4)
else()
    target_compile_options(gugudan20 PRIVATE -Wall -Wextra -pedantic)
endif()

# 설치 설정 (선택사항)
install(TARGETS gugudan20 DESTINATION bin)
