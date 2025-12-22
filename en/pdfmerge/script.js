// Language switching functionality
function changeLanguage(lang) {
    const currentPath = window.location.pathname;
    const basePath = window.location.origin;
    
    // Extract the current page path without language prefix
    let targetPath = currentPath;
    if (currentPath.includes('/zh/')) {
        targetPath = currentPath.replace('/zh/', '/');
    } else if (currentPath.includes('/en/')) {
        targetPath = currentPath.replace('/en/', '/');
    } else if (currentPath.includes('/ja/')) {
        targetPath = currentPath.replace('/ja/', '/');
    }
    
    // Remove leading slash for proper path construction
    targetPath = targetPath.replace(/^\//, '');
    
    // Navigate to the new language version
    switch(lang) {
        case 'zh':
            window.location.href = basePath + '/zh/' + targetPath;
            break;
        case 'en':
            window.location.href = basePath + '/en/' + targetPath;
            break;
        case 'ja':
            window.location.href = basePath + '/ja/' + targetPath;
            break;
        default:
            window.location.href = basePath + '/' + targetPath;
    }
}

// Set active language button based on current path
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const langButtons = document.querySelectorAll('.lang-switch-btn');
    
    // Remove active class from all buttons
    langButtons.forEach(btn => btn.classList.remove('active'));
    
    // Set active class based on current language
    if (currentPath.includes('/zh/')) {
        document.querySelector('[onclick="changeLanguage(\'zh\')"]').classList.add('active');
    } else if (currentPath.includes('/en/')) {
        document.querySelector('[onclick="changeLanguage(\'en\')"]').classList.add('active');
    } else if (currentPath.includes('/ja/')) {
        document.querySelector('[onclick="changeLanguage(\'ja\')"]').classList.add('active');
    }
});