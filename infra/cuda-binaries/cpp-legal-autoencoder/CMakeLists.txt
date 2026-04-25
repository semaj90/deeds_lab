cmake_minimum_required(VERSION 3.18)
project(LegalAutoencoderProjection)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find CUDA
find_package(CUDA REQUIRED)
if (CUDA_FOUND)
    message(STATUS "CUDA found: ${CUDA_VERSION}")
    include_directories(${CUDA_INCLUDE_DIRS})
else()
    message(FATAL_ERROR "CUDA not found")
endif()

# Find cuBLAS
find_library(CUBLAS_LIBRARY cublas HINTS ${CUDA_TOOLKIT_ROOT_DIR}/lib64)
if (CUBLAS_LIBRARY)
    message(STATUS "cuBLAS found: ${CUBLAS_LIBRARY}")
else()
    message(FATAL_ERROR "cuBLAS not found")
endif()

# Find cpp-httplib
include(FetchContent)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.12.3
)
FetchContent_MakeAvailable(httplib)

# Find nlohmann/json
FetchContent_Declare(
    nlohmann_json
    URL https://github.com/nlohmann/json/releases/download/v3.11.2/json.tar.xz
)
FetchContent_MakeAvailable(nlohmann_json)

# Source files
set(SOURCES
    legal_autoencoder_projection.cpp
)

# CUDA source files (if any)
set(CUDA_SOURCES
    # Add CUDA kernels here if separated
)

# Create executable
add_executable(legal_autoencoder_service ${SOURCES})

# Link libraries
target_link_libraries(legal_autoencoder_service
    ${CUDA_LIBRARIES}
    ${CUBLAS_LIBRARY}
    httplib::httplib
    nlohmann_json::nlohmann_json
)

# CUDA specific settings
set_target_properties(legal_autoencoder_service PROPERTIES
    CUDA_SEPARABLE_COMPILATION ON
    CUDA_ARCHITECTURES "70;75;80;86"  # Support RTX 30/40 series
)

# Include directories
target_include_directories(legal_autoencoder_service PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)

# Compiler flags
target_compile_options(legal_autoencoder_service PRIVATE
    $<$<COMPILE_LANGUAGE:CXX>:-O3 -march=native>
    $<$<COMPILE_LANGUAGE:CUDA>:-O3 --use_fast_math>
)

# Installation
install(TARGETS legal_autoencoder_service
    RUNTIME DESTINATION bin
)