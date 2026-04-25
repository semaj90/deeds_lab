cmake_minimum_required(VERSION 3.16)
project(granite-docling-worker)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Windows-specific settings
if(MSVC)
    # MSVC compiler flags
    add_compile_options(/W4 /WX)
    add_compile_options(/arch:AVX2)  # Enable AVX2
    add_compile_options(/O2)  # Optimization level 2
    add_compile_options(/fp:fast)  # Fast floating point

    # Link-time optimization
    add_compile_options(/GL)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /LTCG")
elseif(MINGW)
    # MinGW compiler flags
    add_compile_options(-Wall -Wextra -Werror)
    add_compile_options(-mavx2)  # Enable AVX2
    add_compile_options(-O3)  # Optimization level 3
    add_compile_options(-ffast-math)  # Fast math
    add_compile_options(-flto)  # Link-time optimization
endif()

# Find required packages
find_package(Python3 REQUIRED COMPONENTS Interpreter Development)
find_package(CUDA QUIET)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)
include_directories(${Python3_INCLUDE_DIRS})

# Source files
set(SOURCES
    src/core/simd_accelerator.cpp
    src/core/tesseract_wrapper.cpp
)

# Create library
add_library(granite_worker STATIC ${SOURCES})

# Link Python
target_link_libraries(granite_worker ${Python3_LIBRARIES})

# CUDA support (optional)
if(CUDA_FOUND)
    enable_language(CUDA)
    set(CMAKE_CUDA_STANDARD 17)
    set(CMAKE_CUDA_STANDARD_REQUIRED ON)

    # CUDA compiler flags
    set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -O3 -arch=sm_86")

    target_compile_definitions(granite_worker PRIVATE CUDA_ENABLED)
    target_link_libraries(granite_worker ${CUDA_LIBRARIES})
endif()

# Installation
install(TARGETS granite_worker
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(DIRECTORY src/
    DESTINATION include
    FILES_MATCHING PATTERN "*.h"
)

# Testing
enable_testing()
add_subdirectory(tests)
