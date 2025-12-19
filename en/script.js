// 全局变量
let uploadedImages = [];
let currentPdf = null;
let pdfPages = [];
let isPreviewingPdf = false;
let currentLoadingTask = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }
    
    // 根据URL路径自动初始化对应的功能
    const path = window.location.pathname;
    
    if (path.includes('/pic2pdf/')) {
        // 只初始化图片转PDF功能
        initializeImageToPdf();
    } else if (path.includes('/pdf2pic/')) {
        // 只初始化PDF转图片功能
        initializePdfToImage();
    } else {
        // 默认情况：初始化所有功能
        initializeTabs();
        initializeImageToPdf();
        initializePdfToImage();
    }
});

// 初始化标签页功能
function initializeTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // 更新按钮状态
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// 初始化图片转PDF功能
function initializeImageToPdf() {
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const imageGrid = document.getElementById('imageGrid');
    const sortByNameBtn = document.getElementById('sortByName');
    const sortByTimeBtn = document.getElementById('sortByTime');
    const generatePdfBtn = document.getElementById('generatePdf');
    
    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => imageInput.click());
    
    // 文件选择事件
    imageInput.addEventListener('change', handleImageUpload);
    
    // 拖拽事件
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.classList.add('dragover');
    });
    
    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.classList.remove('dragover');
    });
    
    imageUploadArea.addEventListener('drop', handleImageDrop);
    
    // 排序按钮事件
    sortByNameBtn.addEventListener('click', () => sortImages('name'));
    sortByTimeBtn.addEventListener('click', () => sortImages('time'));
    
    // 生成PDF按钮事件
    generatePdfBtn.addEventListener('click', generatePdf);
    
    // 清空按钮事件
    const clearImagesBtn = document.getElementById('clearImages');
    clearImagesBtn.addEventListener('click', () => {
        uploadedImages = [];
        updateImageGrid();
    });
    
    // 初始化图片网格
    updateImageGrid();
}

// 处理图片上传
function handleImageUpload(e) {
    handleImageFiles(e.target.files);
    // 清空文件输入，以便再次选择相同文件时能触发change事件
    e.target.value = '';
}

// 处理图片文件
function handleImageFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadedImages.push({
                        id: Date.now() + Math.random(),
                        file: file,
                        url: e.target.result,
                        width: img.width,
                        height: img.height,
                        rotation: 0,
                        uploadTime: Date.now()
                    });
                    updateImageGrid();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// 处理拖拽上传的情况
function handleImageDrop(e) {
    e.preventDefault();
    document.getElementById('imageUploadArea').classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleImageFiles(e.dataTransfer.files);
    }
}

// 更新图片网格
function updateImageGrid() {
    const imageGrid = document.getElementById('imageGrid');
    
    if (uploadedImages.length === 0) {
        imageGrid.innerHTML = `<p class="empty-state">Please upload images first</p>`;
        return;
    }
    
    imageGrid.innerHTML = '';
    
    uploadedImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.draggable = true;
        imageItem.dataset.index = index;
        
        imageItem.innerHTML = `
            <div style="position: relative; overflow: hidden; height: 150px;">
                <img src="${image.url}" alt="${image.file.name}" class="image-preview" style="transform: rotate(${image.rotation}deg); width: 100%; height: 100%; object-fit: contain;">
                <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem;">
                    <button class="rotate-btn" data-index="${index}" title="Rotate Image">&#8635;</button>
                    <button class="delete-btn" data-index="${index}" title="Delete Image">&times;</button>
                </div>
            </div>
            <div class="image-filename">${image.file.name}</div>
        `;
        
        // 添加拖拽事件
        imageItem.addEventListener('dragstart', handleDragStart);
        imageItem.addEventListener('dragover', handleDragOver);
        imageItem.addEventListener('drop', handleDrop);
        imageItem.addEventListener('dragenter', handleDragEnter);
        imageItem.addEventListener('dragleave', handleDragLeave);
        
        // 添加按钮事件
        imageItem.querySelector('.rotate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            rotateImage(index);
        });
        
        imageItem.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteImage(index);
        });
        
        imageGrid.appendChild(imageItem);
    });
}

// 拖拽开始
function handleDragStart(e) {
    // 确保dataTransfer包含正确的索引
    const draggedItem = e.target.closest('.image-item');
    if (draggedItem) {
        e.dataTransfer.setData('text/plain', draggedItem.dataset.index);
        draggedItem.classList.add('dragging');
        // 设置拖拽效果
        e.dataTransfer.effectAllowed = 'move';
    }
}

// 拖拽经过
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// 拖拽进入
function handleDragEnter(e) {
    e.preventDefault();
    const targetItem = e.target.closest('.image-item');
    if (targetItem && !targetItem.classList.contains('dragging')) {
        targetItem.style.opacity = '0.5';
    }
}

// 拖拽离开
function handleDragLeave(e) {
    const targetItem = e.target.closest('.image-item');
    if (targetItem && !targetItem.classList.contains('dragging')) {
        targetItem.style.opacity = '1';
    }
}

// 拖拽释放
function handleDrop(e) {
    e.preventDefault();
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetItem = e.target.closest('.image-item');
    
    if (targetItem) {
        const targetIndex = parseInt(targetItem.dataset.index);
        
        if (draggedIndex !== targetIndex) {
            // 重新排序
            const [draggedImage] = uploadedImages.splice(draggedIndex, 1);
            uploadedImages.splice(targetIndex, 0, draggedImage);
            updateImageGrid();
        }
        
        // 恢复样式
        targetItem.style.opacity = '1';
    }
    
    // 清理所有拖拽状态
    document.querySelectorAll('.image-item').forEach(item => {
        item.classList.remove('dragging');
        item.style.opacity = '1';
    });
}

// 旋转图片
function rotateImage(index) {
    uploadedImages[index].rotation = (uploadedImages[index].rotation + 90) % 360;
    updateImageGrid();
}

// 删除图片
function deleteImage(index) {
    uploadedImages.splice(index, 1);
    updateImageGrid();
}

// 排序图片
function sortImages(type) {
    if (type === 'name') {
        uploadedImages.sort((a, b) => a.file.name.localeCompare(b.file.name));
    } else if (type === 'time') {
        uploadedImages.sort((a, b) => a.uploadTime - b.uploadTime);
    }
    updateImageGrid();
}

// 生成PDF
async function generatePdf() {
    if (uploadedImages.length === 0) {
        alert('Please upload images first');
        return;
    }
    
    // 获取生成PDF按钮
    const generatePdfBtn = document.getElementById('generatePdf');
    // 保存原始按钮文本
    const originalText = generatePdfBtn.textContent;
    // 禁用按钮并显示加载状态
    generatePdfBtn.disabled = true;
    generatePdfBtn.textContent = 'Generating...';
    
    // 获取进度条元素
    const progressContainer = document.getElementById('imageProgressContainer');
    const progressFill = document.getElementById('imageProgressFill');
    const progressText = document.getElementById('imageProgressText');
    
    try {
        // 获取设置
        const pageSize = document.getElementById('pageSize').value;
        const pageOrientation = document.getElementById('pageOrientation').value;
        const margin = parseInt(document.getElementById('margin').value) || 0;
        const pdfFileName = document.getElementById('pdfFileName').value || 'merged.pdf';
        
        // 创建PDF文档
        const pdfDoc = await PDFLib.PDFDocument.create();
        
        // 页面尺寸映射
        const pageSizes = {
            A4: { width: 595.28, height: 841.89 },
            A3: { width: 841.89, height: 1190.55 },
            A5: { width: 419.53, height: 595.28 },
            Letter: { width: 612, height: 792 },
            Legal: { width: 612, height: 1008 }
        };
        
        // 显示进度条
        progressContainer.style.display = 'block';
        
        // 初始化进度计数器
        let currentProgress = 0;
        const totalImages = uploadedImages.length;
        
        for (const image of uploadedImages) {
            // 更新进度
            currentProgress++;
            const progressPercentage = Math.round((currentProgress / totalImages) * 100);
            generatePdfBtn.textContent = `Generating... ${currentProgress}/${totalImages}`;
            
            // 更新进度条
            progressFill.style.width = `${progressPercentage}%`;
            progressText.textContent = `${progressPercentage}% (${currentProgress}/${totalImages})`;
            
            // 计算实际尺寸和旋转后的宽高
            let imgWidth = image.width;
            let imgHeight = image.height;
            if (image.rotation % 180 !== 0) {
                [imgWidth, imgHeight] = [imgHeight, imgWidth];
            }
            
            // 确定PDF页面尺寸和朝向
            let pdfWidth, pdfHeight;
            if (pageSize === 'Custom') {
                // 自定义尺寸：根据图片尺寸
                pdfWidth = imgWidth * 0.75; // 转换为点（1px = 0.75pt）
                pdfHeight = imgHeight * 0.75;
            } else {
                // 预设尺寸
                const size = pageSizes[pageSize];
                if (pageOrientation === 'portrait' || pageOrientation === 'auto' && imgHeight > imgWidth) {
                    pdfWidth = size.width;
                    pdfHeight = size.height;
                } else {
                    pdfWidth = size.height;
                    pdfHeight = size.width;
                }
            }
            
            // 添加页面
            const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
            
            // 先处理图片旋转
            let processedImageUrl = image.url;
            let processedImageWidth = imgWidth;
            let processedImageHeight = imgHeight;
            
            if (image.rotation !== 0) {
                // 使用Canvas API旋转图片
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = image.url;
                });
                
                // 根据旋转角度调整Canvas大小
                if (image.rotation % 180 === 0) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                } else {
                    canvas.width = img.height;
                    canvas.height = img.width;
                }
                
                // 设置旋转中心和旋转角度
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((image.rotation * Math.PI) / 180);
                ctx.translate(-img.width / 2, -img.height / 2);
                
                // 绘制旋转后的图片
                ctx.drawImage(img, 0, 0);
                
                // 转换为DataURL
                processedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
                processedImageWidth = canvas.width;
                processedImageHeight = canvas.height;
            }
            
            // 加载处理后的图片
            const imgBytes = await fetch(processedImageUrl).then(res => res.arrayBuffer());
            let pdfImage;
            // 根据图片类型选择正确的嵌入方法
            if (image.file.type === 'image/jpeg' || image.file.type === 'image/jpg') {
                pdfImage = await pdfDoc.embedJpg(imgBytes);
            } else if (image.file.type === 'image/png') {
                // 使用Canvas API将PNG转换为JPG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = processedImageUrl;
                });
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 转换为JPG格式
                const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const jpgBytes = await fetch(jpgDataUrl).then(res => res.arrayBuffer());
                pdfImage = await pdfDoc.embedJpg(jpgBytes);
            } else {
                // 其他图片格式，通过Canvas转换为JPG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = processedImageUrl;
                });
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // 转换为JPG格式
                const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const jpgBytes = await fetch(jpgDataUrl).then(res => res.arrayBuffer());
                pdfImage = await pdfDoc.embedJpg(jpgBytes);
            }
            
            // 重新计算旋转后的图片比例
            const imgRatio = processedImageWidth / processedImageHeight;
            const pdfRatio = pdfWidth / pdfHeight;
            
            let imgX, imgY, imgDisplayWidth, imgDisplayHeight;
            if (imgRatio > pdfRatio) {
                // 图片更宽
                imgDisplayWidth = pdfWidth - (margin * 2); // 两侧边距
                imgDisplayHeight = imgDisplayWidth / imgRatio;
                imgX = margin;
                imgY = (pdfHeight - imgDisplayHeight) / 2;
            } else {
                // 图片更高
                imgDisplayHeight = pdfHeight - (margin * 2); // 上下边距
                imgDisplayWidth = imgDisplayHeight * imgRatio;
                imgX = (pdfWidth - imgDisplayWidth) / 2;
                imgY = margin;
            }
            
            // 绘制图片
            page.drawImage(pdfImage, {
                x: imgX,
                y: imgY,
                width: imgDisplayWidth,
                height: imgDisplayHeight
            });
        }
        
        // 生成PDF数据
        const pdfBytes = await pdfDoc.save();
        
        // 下载PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, pdfFileName);
        
    } catch (error) {
        console.error('生成PDF失败:', error);
        alert('PDF generation failed, please try again');
    } finally {
        // 恢复按钮状态
        const generatePdfBtn = document.getElementById('generatePdf');
        generatePdfBtn.disabled = false;
        generatePdfBtn.textContent = 'Generate PDF';
        
        // 隐藏进度条
        progressContainer.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '';
    }
}

// 初始化PDF转图片功能
function initializePdfToImage() {
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const pdfUploadBtn = document.getElementById('pdfUploadBtn');
    const pdfPreview = document.getElementById('pdfPreview');
    const convertPdfBtn = document.getElementById('convertPdf');
    const pausePreviewBtn = document.getElementById('pausePreview');
    
    // 上传按钮点击事件
    pdfUploadBtn.addEventListener('click', () => pdfInput.click());
    
    // 文件选择事件
    pdfInput.addEventListener('change', handlePdfUpload);
    
    // 拖拽事件
    pdfUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfUploadArea.classList.add('dragover');
    });
    
    pdfUploadArea.addEventListener('dragleave', () => {
        pdfUploadArea.classList.remove('dragover');
    });
    
    pdfUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handlePdfFile(e.dataTransfer.files[0]);
        }
    });
    
    // 转换按钮事件
    convertPdfBtn.addEventListener('click', convertPdfToImages);
    
    // 暂停预览按钮事件
    pausePreviewBtn.addEventListener('click', pausePreview);
}

// 处理PDF上传
function handlePdfUpload(e) {
    if (e.target.files.length > 0) {
        handlePdfFile(e.target.files[0]);
    }
}

// 处理PDF文件
function handlePdfFile(file) {
    currentPdf = file;
    pdfPages = [];
    
    // 预览PDF
    previewPdf(file);
}

// 预览PDF
function previewPdf(file) {
    const pdfPreview = document.getElementById('pdfPreview');
    const reader = new FileReader();
    const pausePreviewBtn = document.getElementById('pausePreview');
    
    // 获取进度条元素
    const progressContainer = document.getElementById('pdfLoadProgressContainer');
    const progressFill = document.getElementById('pdfLoadProgressFill');
    const progressText = document.getElementById('pdfLoadProgressText');
    
    // 确保进度条元素存在
    console.log('进度条元素:', progressContainer, progressFill, progressText);
    
    // 设置预览状态为true
    isPreviewingPdf = true;
    currentLoadingTask = null;
    
    // 启用暂停预览按钮
    pausePreviewBtn.disabled = false;
    
    // 显示进度条
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing...';
    
    // 清空预览区域
    pdfPreview.innerHTML = `<h4>Generating ${file.name}...</h4>`;
    
    reader.onload = async function(e) {
        if (!isPreviewingPdf) return;
        
        try {
            // 创建PDF加载参数
            const loadingTask = pdfjsLib.getDocument({
                data: e.target.result,
                disableAutoFetch: true,
                disableRange: false,
                verbosity: 0
            });
            
            // 保存当前加载任务引用，以便后续取消
            currentLoadingTask = loadingTask;
            
            // 监听加载进度
            loadingTask.onProgress = function(progressData) {
                if (!isPreviewingPdf) return;
                
                // 更新进度条
                const progressPercentage = Math.round(progressData.loaded / progressData.total * 100);
                progressFill.style.width = `${progressPercentage}%`;
                progressText.textContent = `Loading ${progressPercentage}%`;
            };
            
            // 加载PDF文档
            const pdfDoc = await loadingTask.promise;
            
            if (!isPreviewingPdf) return;
            
            // 获取PDF总页数
            const totalPages = pdfDoc.numPages;
            
            // 更新进度状态
            progressText.textContent = 'Rendering pages...';
            
            // 清空预览区域
            pdfPreview.innerHTML = '';
            
            // 渲染每一页
            let renderProgress = 0;
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                if (!isPreviewingPdf) break;
                
                try {
                    // 获取当前页
                    const page = await pdfDoc.getPage(pageNum);
                    
                    // 设置渲染参数
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    // 创建Canvas元素
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.classList.add('pdf-preview-page');
                    
                    // 创建页面容器
                    const pageContainer = document.createElement('div');
                    pageContainer.classList.add('pdf-preview-page-container');
                    pageContainer.appendChild(canvas);
                    
                    // 添加到预览区域
                    pdfPreview.appendChild(pageContainer);
                    
                    // 渲染页面
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    
                    // 监听渲染进度
                    await page.render(renderContext).promise;
                    
                    // 更新进度
                    renderProgress++;
                    progressText.textContent = `Rendering ${renderProgress}/${totalPages}`;
                    
                    // 将页面数据添加到pdfPages数组
                    pdfPages.push({
                        pageNum: pageNum,
                        canvas: canvas,
                        width: viewport.width,
                        height: viewport.height
                    });
                    
                } catch (pageError) {
                    console.error(`渲染页面 ${pageNum} 失败:`, pageError);
                    if (!isPreviewingPdf) break;
                }
            }
            
            if (isPreviewingPdf) {
                // 预览完成
                progressText.textContent = 'Completed';
            }
            
        } catch (error) {
            console.error('预览PDF失败:', error);
            if (isPreviewingPdf) {
                pdfPreview.innerHTML = `<p class="empty-state">Conversion failed</p>`;
                progressText.textContent = 'Failed';
            }
        }
    };
    
    reader.onerror = function(error) {
        console.error('读取PDF失败:', error);
        if (isPreviewingPdf) {
            pdfPreview.innerHTML = `<p class="empty-state">Conversion failed</p>`;
            progressText.textContent = 'Read failed';
        }
    };
    
    // 开始读取文件
    reader.readAsArrayBuffer(file);
}

// 暂停预览
function pausePreview() {
    isPreviewingPdf = false;
    
    // 禁用暂停预览按钮
    const pausePreviewBtn = document.getElementById('pausePreview');
    pausePreviewBtn.disabled = true;
    
    // 取消当前加载任务
    if (currentLoadingTask) {
        currentLoadingTask.destroy();
        currentLoadingTask = null;
    }
    
    // 更新预览区域
    const pdfPreview = document.getElementById('pdfPreview');
    pdfPreview.innerHTML = `<p class="empty-state">Preview paused</p><p>You can click the "Convert to Images" button directly to convert images</p>`;
    
    // 隐藏进度条
    const progressContainer = document.getElementById('pdfLoadProgressContainer');
    progressContainer.style.display = 'none';
}

// PDF转图片
async function convertPdfToImages() {
    if (!currentPdf) {
        alert('Please upload PDF first');
        return;
    }
    
    // 获取转换按钮
    const convertBtn = document.getElementById('convertPdf');
    // 保存原始按钮文本
    const originalText = convertBtn.textContent;
    // 禁用按钮并显示加载状态
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    // 获取进度条元素
    const progressContainer = document.getElementById('pdfLoadProgressContainer');
    const progressFill = document.getElementById('pdfLoadProgressFill');
    const progressText = document.getElementById('pdfLoadProgressText');
    
    // 获取设置
    const dpi = parseInt(document.getElementById('dpi').value) || 300;
    const imageFormat = document.getElementById('imageFormat').value || 'png';
    
    try {
        // 如果已经有预览的页面，直接使用
        if (pdfPages.length > 0 && isPreviewingPdf) {
            // 直接转换预览的页面
            await convertPreviewedPages(dpi, imageFormat, convertBtn, progressContainer, progressFill, progressText);
        } else {
            // 没有预览或预览已暂停，直接转换PDF文件
            await convertPdfFile(dpi, imageFormat, convertBtn, progressContainer, progressFill, progressText);
        }
        
    } catch (error) {
        console.error('PDF转图片失败:', error);
        alert('Conversion failed, please try again');
    } finally {
        // 恢复按钮状态
        convertBtn.disabled = false;
        convertBtn.textContent = originalText;
        
        // 隐藏进度条
        progressContainer.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '';
    }
}

// 转换已预览的页面
async function convertPreviewedPages(dpi, imageFormat, convertBtn, progressContainer, progressFill, progressText) {
    const totalPages = pdfPages.length;
    
    // 显示进度条
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Converting...';
    
    // 转换每一页
    for (let i = 0; i < totalPages; i++) {
        const page = pdfPages[i];
        
        // 更新进度
        const progressPercentage = Math.round(((i + 1) / totalPages) * 100);
        progressFill.style.width = `${progressPercentage}%`;
        
        // 转换并下载图片
        await convertAndDownloadImage(page.canvas, page.pageNum, imageFormat, dpi);
    }
    
    // 转换完成
    progressText.textContent = 'Completed';
}

// 语言切换功能
function changeLanguage(languageCode) {
    // 获取当前路径
    const path = window.location.pathname;
    
    // 构建新的语言路径
    let newPath;
    if (path.includes('/en/')) {
        newPath = path.replace('/en/', `/${languageCode}/`);
    } else if (path.includes('/zh/')) {
        newPath = path.replace('/zh/', `/${languageCode}/`);
    } else if (path.includes('/ja/')) {
        newPath = path.replace('/ja/', `/${languageCode}/`);
    } else {
        // 如果当前不在语言目录中，直接添加语言目录
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0) {
            newPath = `/${languageCode}/${parts.join('/')}`;
        } else {
            newPath = `/${languageCode}/`;
        }
    }
    
    // 重定向到新路径
    window.location.href = newPath;
}

// 直接转换PDF文件
async function convertPdfFile(dpi, imageFormat, convertBtn, progressContainer, progressFill, progressText) {
    const reader = new FileReader();
    
    // 显示进度条
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing...';
    
    return new Promise((resolve, reject) => {
        reader.onload = async function(e) {
            try {
                // 加载PDF文档
                const pdfDoc = await pdfjsLib.getDocument({
                    data: e.target.result,
                    verbosity: 0
                }).promise;
                
                // 获取PDF总页数
                const totalPages = pdfDoc.numPages;
                
                // 转换每一页
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    // 更新进度
                    const progressPercentage = Math.round(((pageNum - 1) / totalPages) * 100);
                    progressFill.style.width = `${progressPercentage}%`;
                    progressText.textContent = `Converting ${pageNum}/${totalPages}`;
                    
                    // 获取当前页
                    const page = await pdfDoc.getPage(pageNum);
                    
                    // 设置渲染参数
                    const scale = dpi / 72; // PDF默认72DPI
                    const viewport = page.getViewport({ scale: scale });
                    
                    // 创建Canvas元素
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    // 渲染页面
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    
                    await page.render(renderContext).promise;
                    
                    // 转换并下载图片
                    await convertAndDownloadImage(canvas, pageNum, imageFormat, dpi);
                }
                
                // 转换完成
                progressText.textContent = 'Completed';
                
                resolve();
                
            } catch (error) {
                console.error('直接转换PDF失败:', error);
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            console.error('读取PDF失败:', error);
            progressText.textContent = 'Read failed';
            reject(error);
        };
        
        // 开始读取文件
        reader.readAsArrayBuffer(currentPdf);
    });
}

// 转换并下载图片
async function convertAndDownloadImage(canvas, pageNum, imageFormat, dpi) {
    return new Promise((resolve) => {
        // 根据选择的格式转换图片
        const mimeType = imageFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        
        // 获取文件名
        const pdfFileName = currentPdf.name.replace(/\.pdf$/i, '');
        
        // 转换为Blob对象
        canvas.toBlob((blob) => {
            // 下载图片
            saveAs(blob, `${pdfFileName}_page${pageNum}.${imageFormat}`);
            resolve();
        }, mimeType, 0.9);
    });
}