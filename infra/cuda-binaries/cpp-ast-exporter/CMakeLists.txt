cmake_minimum_required(VERSION 3.25)

# Set policy to suppress FindCUDA deprecation warning
cmake_policy(SET CMP0146 OLD)

# ============================================================
# âš™ï¸  YoRHa Legal AI â€” Dynamic CUDA/MSVC Toolchain Config
#   â€¢ Relies on PowerShell script for toolchain and GPU arch detection
#   â€¢ Safe defaults: C++20 / CUDA 17 / AVX2 / fast-math
# ============================================================
project(ASTGraphExporter LANGUAGES CXX CUDA)

# --- Language Standards ------------------------------------------------------
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CUDA_STANDARD 17)
set(CMAKE_CUDA_STANDARD_REQUIRED ON)

# --- Ensure CUDA is found (toolchain set by PowerShell) ----------------------
find_package(CUDAToolkit REQUIRED)

# Fix LibTorch CUDA paths on Windows to prevent libnvrtc.so warnings
set(CUDA_TOOLKIT_ROOT_DIR "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v13.0")
set(CUDAToolkit_ROOT "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v13.0")
set(CMAKE_CUDA_IMPLICIT_LINK_DIRECTORIES "${CUDA_TOOLKIT_ROOT_DIR}/lib/x64")

# Add CUDA include and link directories
include_directories(${CUDAToolkit_INCLUDE_DIRS})
link_directories(${CUDAToolkit_LIBRARY_DIR})

# --- Global optimization flags -----------------------------------------------
if(MSVC)
    set(MSVC_FLAGS /arch:AVX2 /fp:fast /EHsc)
    set(CUDA_HOST_FLAGS /arch:AVX2 /fp:fast /EHsc)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    set(MSVC_FLAGS -O3 -mavx2 -ffast-math)
    set(CUDA_HOST_FLAGS -O3 -mavx2 -ffast-math)
else()
    set(MSVC_FLAGS -O3 -mavx2 -ffast-math)
    set(CUDA_HOST_FLAGS -O3 -mavx2 -ffast-math)
endif()

# --- Output directories ------------------------------------------------------
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# --- Diagnostics -------------------------------------------------------------
message(STATUS "ðŸ”§ MSVC compiler  : ${CMAKE_CXX_COMPILER}")
message(STATUS "ðŸ”§ CUDA compiler  : ${CMAKE_CUDA_COMPILER}")
message(STATUS "ðŸ”§ CUDA version   : ${CUDAToolkit_VERSION}")
message(STATUS "ðŸ”§ Target GPU arch: sm_86")
message(STATUS "ðŸ”§ Output dir     : ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}")

# ------------------------------------------------------------------------------
# Enable TensorCore libraries
# ------------------------------------------------------------------------------
find_package(CUDA REQUIRED)
# Prevent PyTorch from warning about CMAKE_CUDA_ARCHITECTURES by clearing the
# cache entry and explicitly declaring the supported SM version before
# LibTorch config is loaded.
unset(CMAKE_CUDA_ARCHITECTURES CACHE)
set(TORCH_CUDA_ARCH_LIST "8.6")
find_package(Torch REQUIRED PATHS "C:/libtorch-win-shared-with-deps-2.9.0+cu130/libtorch")

# cuBLAS + cuBLASLt
set(CUDA_LIBRARIES
    ${CUDA_LIBRARIES}
    ${CUDA_cublas_LIBRARY}
    ${CUDA_cublasLt_LIBRARY}
)

# cuDNN discovery (default to NVIDIA cuDNN v9.16 install, override with -DCUDNN_ROOT=...).
set(CUDNN_ROOT "C:/Program Files/NVIDIA/CUDNN/v9.16" CACHE PATH "Path to the cuDNN installation directory")
find_path(CUDNN_INCLUDE_DIR
    NAMES cudnn.h
    HINTS "${CUDNN_ROOT}"
    PATH_SUFFIXES include include/13.0 include/12.9 include/win64 include/x64
)
find_library(CUDNN_LIBRARY
    NAMES cudnn64_9 cudnn64_8 cudnn64_7 cudnn64 cudnn
    HINTS "${CUDNN_ROOT}"
    PATH_SUFFIXES lib lib/13.0 lib/13.0/x64 lib/12.9 lib/12.9/x64 lib/x64 lib/Win64 bin bin/x64
)
if(CUDNN_INCLUDE_DIR AND CUDNN_LIBRARY)
    set(CUDNN_FOUND TRUE)
    set(CUDNN_INCLUDE_DIRS ${CUDNN_INCLUDE_DIR})
    set(CUDNN_LIBRARIES ${CUDNN_LIBRARY})
else()
    set(CUDNN_FOUND FALSE)
endif()

if(CUDNN_FOUND)
    message(STATUS "Found cuDNN at: ${CUDNN_ROOT}")
    include_directories(${CUDNN_INCLUDE_DIRS})
    list(APPEND CUDA_LIBRARIES ${CUDNN_LIBRARIES})
else()
    message(WARNING "cuDNN not found at '${CUDNN_ROOT}'. Set CUDNN_ROOT to your cuDNN installation directory.")
endif()


# CUTLASS (header-only)
set(CUTLASS_ROOT "C:/cutlass")
include_directories(${CUTLASS_ROOT})
include_directories("${CUTLASS_ROOT}/include")
include_directories("${CUTLASS_ROOT}/tools/util/include")

# ------------------------------------------------------------------------------
# Tensor Core NVCC flags
# ------------------------------------------------------------------------------
set(CUDA_NVCC_FLAGS
    ${CUDA_NVCC_FLAGS}
    -arch=sm_86                       # Ampere Tensor Core arch
    -use_fast_math                    # enables tensor-core fast-math
    -lineinfo
    --expt-relaxed-constexpr
    --expt-extended-lambda
    --disable-warnings
    -Xcompiler=/EHsc
    --generate-line-info
    -ftz=true                    # flush denormals
    -prec-div=false
    -prec-sqrt=false
    -Xptxas -v
)

# For TensorFloat32:
add_definitions(-DUSE_TF32)

# Torch needs this:

message(STATUS "âš¡ Tensor Core acceleration enabled for SM 86 (Ampere)")
message(STATUS "ðŸ“š cuBLAS, cuBLASLt, cuDNN, and CUTLASS enabled")

# ============================================================
#   Source Targets Below  â¬‡ï¸
# ============================================================

# --- Source files for AST Graph Exporter ------------------------------------
set(AST_EXPORTER_SOURCES
    src/main.cpp
    src/neo4j_exporter.cpp
    src/ast_graph.cpp
)

add_executable(ast_graph_exporter ${AST_EXPORTER_SOURCES})
target_link_libraries(ast_graph_exporter PRIVATE CUDA::cudart CUDA::cuda_driver ws2_32 crypt32 ${CUDA_LIBRARIES})
target_compile_definitions(ast_graph_exporter PRIVATE _CRT_SECURE_NO_WARNINGS NOMINMAX)
target_include_directories(ast_graph_exporter PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS})
target_compile_options(ast_graph_exporter PRIVATE ${MSVC_FLAGS})

# --- CUDA static library -----------------------------------------------------
add_library(cuda_library STATIC src/cuda_chunk_processor.cu)
target_include_directories(cuda_library PRIVATE ${CUDAToolkit_INCLUDE_DIRS})
target_link_libraries(cuda_library PRIVATE CUDA::cudart CUDA::cuda_driver)
set_target_properties(cuda_library PROPERTIES
    CUDA_SEPARABLE_COMPILATION OFF
    CUDA_ARCHITECTURES "86"
)
# Clear any inherited compile options that might conflict with CUDA
target_compile_options(cuda_library PRIVATE
    $<$<COMPILE_LANGUAGE:CUDA>:--use_fast_math -g -lineinfo>
)# --- RAG LoRA Trainer --------------------------------------------------------
add_executable(rag_lora_trainer src/rag_lora_trainer.cpp)
target_link_libraries(rag_lora_trainer PRIVATE cuda_library CUDA::cudart CUDA::cuda_driver ${CUDA_LIBRARIES})
target_include_directories(rag_lora_trainer PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS})
target_compile_features(rag_lora_trainer PRIVATE cxx_std_17)
target_compile_options(rag_lora_trainer PRIVATE ${MSVC_FLAGS})

# --- Phase AST: Dataset Ingestion Pipeline -----------------------------------
add_executable(dataset_ingestion_pipeline src/dataset_ingestion_pipeline.cpp)
target_link_libraries(dataset_ingestion_pipeline PRIVATE CUDA::cudart ${CUDA_LIBRARIES} nlohmann_json)
target_include_directories(dataset_ingestion_pipeline PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS} ${nlohmann_json_SOURCE_DIR}/include)
target_compile_features(dataset_ingestion_pipeline PRIVATE cxx_std_17)
target_compile_options(dataset_ingestion_pipeline PRIVATE ${MSVC_FLAGS})

# --- Phase AST: TensorRT-LLM Integration ------------------------------------
add_executable(tensorrt_llm_integration src/tensorrt_llm_integration.cpp)
target_link_libraries(tensorrt_llm_integration PRIVATE cuda_library CUDA::cudart ${CUDA_LIBRARIES})
target_include_directories(tensorrt_llm_integration PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS})
target_compile_features(tensorrt_llm_integration PRIVATE cxx_std_17)
target_compile_options(tensorrt_llm_integration PRIVATE ${MSVC_FLAGS})

# --- Phase AST: QLoRA Benchmark Tool ----------------------------------------
add_executable(qlora_benchmark src/qlora_benchmark.cpp)
target_link_libraries(qlora_benchmark PRIVATE cuda_library CUDA::cudart ${CUDA_LIBRARIES})
target_include_directories(qlora_benchmark PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS} ${nlohmann_json_SOURCE_DIR}/include)
target_compile_features(qlora_benchmark PRIVATE cxx_std_17)
target_compile_options(qlora_benchmark PRIVATE ${MSVC_FLAGS})

# --- Optional LibTorch Integration ------------------------------------------
set(TORCH_DIR "C:/libtorch-win-shared-with-deps-2.9.0+cu130/libtorch")

# Add nlohmann_json via FetchContent (needed for dataset ingestion)
include(FetchContent)
FetchContent_Declare(
    nlohmann_json
    URL https://github.com/nlohmann/json/releases/download/v3.11.2/json.tar.xz
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
set(CMAKE_POLICY_VERSION_MINIMUM 3.5)
FetchContent_MakeAvailable(nlohmann_json)

# nlohmann_json target is already created by FetchContent_MakeAvailable

if (EXISTS "${TORCH_DIR}/share/cmake/Torch/TorchConfig.cmake")
    find_package(Torch REQUIRED PATHS "${TORCH_DIR}")
    message(STATUS "ðŸ'¡ Found LibTorch at ${TORCH_DIR}")

    # Enable LibTorch for all relevant targets
    set(LIBTORCH_TARGETS
        rag_lora_trainer
        dataset_ingestion_pipeline
        tensorrt_llm_integration
        qlora_benchmark
        ast_graph_exporter
    )

    foreach(target ${LIBTORCH_TARGETS})
        target_link_libraries(${target} PRIVATE ${TORCH_LIBRARIES})
        target_include_directories(${target} PRIVATE ${TORCH_INCLUDE_DIRS})
        target_compile_definitions(${target} PRIVATE USE_LIBTORCH)
    endforeach()

    # --- Advanced Quantization Support (INT8/INT4) ---------------------------
    add_library(quantization_engine STATIC src/quantization_engine.cpp)
    target_link_libraries(quantization_engine PRIVATE ${TORCH_LIBRARIES} CUDA::cudart)
    target_include_directories(quantization_engine PRIVATE ${CMAKE_SOURCE_DIR}/include ${TORCH_INCLUDE_DIRS})
    target_compile_features(quantization_engine PRIVATE cxx_std_17)

    # --- Sparse Operations with cuSPARSELt -----------------------------------
    find_library(CUSPARSELT_LIBRARY 
                 NAMES cusparseLt cusparseLt_static cusparselt
                 HINTS 
                     ${CUDAToolkit_LIBRARY_DIR}
                     "${CUDA_TOOLKIT_ROOT_DIR}/lib/x64"
                     "${CUDAToolkit_ROOT}/lib/x64"
                     "C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v13.0/lib/x64"
                 PATH_SUFFIXES lib lib/x64 lib64)
    if(CUSPARSELT_LIBRARY)
        message(STATUS "Found cuSPARSELt: ${CUSPARSELT_LIBRARY}")
        add_library(sparse_operations STATIC src/sparse_operations.cpp)
        target_link_libraries(sparse_operations PRIVATE ${CUSPARSELT_LIBRARY} CUDA::cudart CUDA::cusparse)
        target_include_directories(sparse_operations PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS})
        target_compile_features(sparse_operations PRIVATE cxx_std_17)
    else()
        message(STATUS "cuSPARSELt not found - sparse operations disabled (optional)")
    endif()

    # --- Custom CUDA Extensions ---------------------------------------------
    add_library(custom_cuda_extensions STATIC
        src/custom_cuda_extensions.cpp
        src/custom_cuda_kernels.cu
    )
    target_link_libraries(custom_cuda_extensions PRIVATE
        CUDA::cudart
        CUDA::cuda_driver
        CUDA::cublasLt
        ${CUDA_LIBRARIES}
        ${TORCH_LIBRARIES}
    )
    target_include_directories(custom_cuda_extensions PRIVATE
        ${CMAKE_SOURCE_DIR}/include
        ${CUDAToolkit_INCLUDE_DIRS}
        ${TORCH_INCLUDE_DIRS}
    )
    target_compile_features(custom_cuda_extensions PRIVATE cxx_std_17)
    set_target_properties(custom_cuda_extensions PROPERTIES CUDA_ARCHITECTURES "86")

    # --- Real-time Profiling Dashboard --------------------------------------
    find_library(NVML_LIBRARY NAMES nvml nvidia-ml
                 HINTS ${CUDAToolkit_LIBRARY_DIR} NO_DEFAULT_PATH)
    if(NVML_LIBRARY)
        message(STATUS "Found NVML: ${NVML_LIBRARY}")
        add_executable(profiling_dashboard src/profiling_dashboard.cpp)
        target_link_libraries(profiling_dashboard PRIVATE
            CUDA::cudart
            ${NVML_LIBRARY}
            ${TORCH_LIBRARIES}
            quantization_engine
            custom_cuda_extensions
        )
        target_include_directories(profiling_dashboard PRIVATE
            ${CMAKE_SOURCE_DIR}/include
            ${TORCH_INCLUDE_DIRS}
            ${CUDAToolkit_INCLUDE_DIRS}
        )
        target_compile_features(profiling_dashboard PRIVATE cxx_std_17)
    else()
        message(WARNING "NVML not found - profiling dashboard disabled")
    endif()

    # --- Memory Pool Optimization -------------------------------------------
    add_library(memory_pool STATIC src/memory_pool.cpp)
    target_link_libraries(memory_pool PRIVATE CUDA::cudart CUDA::cuda_driver ${TORCH_LIBRARIES})
    target_include_directories(memory_pool PRIVATE ${CMAKE_SOURCE_DIR}/include ${CUDAToolkit_INCLUDE_DIRS} ${TORCH_INCLUDE_DIRS})
    target_compile_features(memory_pool PRIVATE cxx_std_17)

    # Update existing targets to use new libraries
    target_link_libraries(rag_lora_trainer PRIVATE
        quantization_engine
        custom_cuda_extensions
        memory_pool
        CUDA::cuda_driver
    )

    target_link_libraries(tensorrt_llm_integration PRIVATE
        quantization_engine
        custom_cuda_extensions
        memory_pool
        CUDA::cuda_driver
    )

    target_link_libraries(qlora_benchmark PRIVATE
        quantization_engine
        custom_cuda_extensions
        memory_pool
        CUDA::cuda_driver
    )

    if(TARGET sparse_operations)
        target_link_libraries(rag_lora_trainer PRIVATE sparse_operations)
        target_link_libraries(tensorrt_llm_integration PRIVATE sparse_operations)
        target_link_libraries(qlora_benchmark PRIVATE sparse_operations)
    endif()

else()
    message(WARNING "âš ï¸  LibTorch not found at ${TORCH_DIR} â€” PyTorch integration skipped.")
endif()

# --- Final messages ----------------------------------------------------------
message(STATUS "âœ… AST Graph Exporter configured with CUDA ${CUDAToolkit_VERSION} (sm_86)")
message(STATUS "âœ… RAG LoRA Trainer ready â€” optimized for AVX2 + fast-math")
