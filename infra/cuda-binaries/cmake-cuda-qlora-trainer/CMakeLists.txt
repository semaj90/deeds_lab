cmake_minimum_required(VERSION 3.18)
project(LegalAIQLoRATrainer LANGUAGES CXX CUDA)

# Set C++ and CUDA standards
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

# CUDA Compute Capability for RTX 3060 Ti (SM 86)
set(CMAKE_CUDA_ARCHITECTURES 86)
set(CMAKE_CUDA_SEPARABLE_COMPILATION ON)

# Build type
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Compiler flags for optimization
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -march=native")
set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -use_fast_math -O3")
set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -gencode arch=compute_86,code=sm_86")
set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} -Xptxas -O3")
set(CMAKE_CUDA_FLAGS "${CMAKE_CUDA_FLAGS} --threads-per-block=256")

# Find required packages
find_package(CUDA REQUIRED)
find_package(PkgConfig REQUIRED)

# Find vcpkg packages
find_package(gRPC CONFIG REQUIRED)
find_package(Protobuf CONFIG REQUIRED)
find_package(absl CONFIG REQUIRED)

# Find CUDA libraries
find_library(CUBLAS_LIBRARIES cublas HINTS ${CUDA_TOOLKIT_ROOT_DIR}/lib64)
find_library(CUBLASLT_LIBRARIES cublasLt HINTS ${CUDA_TOOLKIT_ROOT_DIR}/lib64)
find_library(CUDNN_LIBRARIES cudnn HINTS ${CUDA_TOOLKIT_ROOT_DIR}/lib64)
find_library(CURAND_LIBRARIES curand HINTS ${CUDA_TOOLKIT_ROOT_DIR}/lib64)

# Global include directories
include_directories(${CUDA_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/proto)

# Proto generation
set(PROTO_FILES
    proto/qlora_trainer.proto
    proto/training_metrics.proto
)

protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS ${PROTO_FILES})
grpc_generate_cpp(GRPC_SRCS GRPC_HDRS ${PROTO_FILES})

# Source files
set(CUDA_SOURCES
    src/cuda/qlora_kernels.cu
    src/cuda/fused_operations.cu
    src/cuda/nf4_quantization.cu
)

set(CPP_SOURCES
    src/main.cpp
    src/qlora_trainer.cpp
    src/grpc_server.cpp
    src/training_manager.cpp
    src/model_checkpoint.cpp
    src/metrics_collector.cpp
    ${PROTO_SRCS}
    ${GRPC_SRCS}
)

# CUDA library
add_library(qlora_cuda STATIC ${CUDA_SOURCES})
target_link_libraries(qlora_cuda
    ${CUDA_LIBRARIES}
    ${CUBLAS_LIBRARIES}
    ${CUBLASLT_LIBRARIES}
    ${CUDNN_LIBRARIES}
    ${CURAND_LIBRARIES}
)

# Main executable
add_executable(qlora_trainer ${CPP_SOURCES})
target_link_libraries(qlora_trainer
    qlora_cuda
    gRPC::grpc++
    protobuf::libprotobuf
    absl::flags
    absl::flags_parse
)

# Install
install(TARGETS qlora_trainer DESTINATION bin)

# Print configuration
message(STATUS "=== Legal AI QLoRA Trainer Configuration ===")
message(STATUS "CUDA Version: ${CUDA_VERSION}")
message(STATUS "CUDA Architectures: ${CMAKE_CUDA_ARCHITECTURES}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "gRPC: ${gRPC_VERSION}")
message(STATUS "Protobuf: ${Protobuf_VERSION}")
message(STATUS "=============================================")