cmake_minimum_required(VERSION 3.25)
project(cuda_vision VERSION 1.0.0 LANGUAGES CXX CUDA)

# Find dependencies
find_package(CUDA REQUIRED)
find_package(OpenCV REQUIRED)
find_package(TensorRT REQUIRED)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CUDA_INCLUDE_DIRS})
include_directories(${OpenCV_INCLUDE_DIRS})
include_directories(${TensorRT_INCLUDE_DIRS})

# Source files
set(CUDA_VISION_SOURCES
    src/vision_kernels.cu
    src/yolo_detector.cpp
    src/sam_segmenter.cpp
    src/ocr_processor.cpp
    src/seal_detector.cpp
)

set(CUDA_VISION_HEADERS
    include/cuda_vision/vision_kernels.cuh
    include/cuda_vision/yolo_detector.h
    include/cuda_vision/sam_segmenter.h
    include/cuda_vision/ocr_processor.h
    include/cuda_vision/seal_detector.h
)

# Create shared library
add_library(cuda_vision SHARED ${CUDA_VISION_SOURCES} ${CUDA_VISION_HEADERS})

# Link libraries
target_link_libraries(cuda_vision
    ${CUDA_LIBRARIES}
    ${CUDA_CUBLAS_LIBRARIES}
    ${CUDA_CUDNN_LIBRARIES}
    ${OpenCV_LIBS}
    ${TensorRT_LIBRARIES}
    nvinfer
    nvinfer_plugin
    nvonnxparser
)

# Set properties
set_target_properties(cuda_vision PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_ARCHITECTURES "86"  # RTX 3060 Ti
    POSITION_INDEPENDENT_CODE ON
)

# CUTLASS integration for fused operations
if(CUTLASS_FOUND)
    target_compile_definitions(cuda_vision PRIVATE CUTLASS_AVAILABLE)
    target_include_directories(cuda_vision PRIVATE ${CUTLASS_INCLUDE_DIR})
endif()

# Install
install(TARGETS cuda_vision
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    PUBLIC_HEADER DESTINATION include/cuda_vision
)