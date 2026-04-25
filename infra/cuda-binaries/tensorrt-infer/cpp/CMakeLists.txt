cmake_minimum_required(VERSION 3.22)
project(trt_wrapper LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CUDA_STANDARD 17)

include_directories("C:/TensorRT/include")
link_directories("C:/TensorRT/lib")

# Find CUDA
find_package(CUDA REQUIRED)

add_library(chr97_gpu_kernels SHARED chr97_gpu_kernels.cu)

add_library(trt_wrapper SHARED trt_wrapper.cpp)

target_link_libraries(trt_wrapper
    nvinfer
    cudart
)

target_link_libraries(chr97_gpu_kernels
    cudart
)