// 国际化支持模块
class I18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
    }
    
    // 初始化国际化
    async init(lang) {
        this.currentLang = lang;
        try {
            // 加载翻译文件
            const response = await fetch(`/translations/${lang}.json`);
            this.translations = await response.json();
            // 应用翻译
            this.applyTranslations();
            return true;
        } catch (error) {
            console.error('加载翻译文件失败:', error);
            return false;
        }
    }
    
    // 获取翻译文本
    t(key) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value[k] === undefined) {
                return key; // 如果找不到翻译，返回原始键
            }
            value = value[k];
        }
        
        return value;
    }
    
    // 应用翻译到页面
    applyTranslations() {
        // 查找所有带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // 根据元素类型应用翻译
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // 输入框更新 placeholder
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                }
            } else if (element.tagName === 'IMG') {
                // 图片更新 alt
                if (element.hasAttribute('alt')) {
                    element.alt = translation;
                }
            } else if (element.tagName === 'OPTION') {
                // 选项更新文本内容
                element.textContent = translation;
            } else {
                // 其他元素更新文本内容
                element.textContent = translation;
            }
        });
        
        // 更新页面标题
        const titleKey = document.querySelector('title[data-i18n]');
        if (titleKey) {
            document.title = this.t(titleKey.getAttribute('data-i18n'));
        }
    }
    
    // 切换语言
    async switchLanguage(lang) {
        // 直接更新URL并重新加载页面到对应语言目录
        const path = window.location.pathname;
        let newPath;
        
        // 检查当前路径是否包含语言子目录
        if (/^\/[a-z]{2}\/$/.test(path)) {
            // 如果包含，替换为新语言
            newPath = path.replace(/^\/[a-z]{2}\/$/, `/${lang}/`);
        } else if (/^\/[a-z]{2}\//.test(path)) {
            // 如果包含语言目录但不是根路径
            newPath = path.replace(/^\/[a-z]{2}\//, `/${lang}/`);
        } else if (path === '/') {
            // 如果是根路径，直接添加新语言目录
            newPath = `/${lang}/`;
        } else {
            // 如果是其他路径，在路径前添加新语言目录
            newPath = `/${lang}${path}`;
        }
        
        window.location.href = newPath;
    }
}

// 创建全局实例
const i18n = new I18n();

// 语言切换功能 - 确保在全局作用域可用
window.changeLanguage = function(lang) {
    i18n.switchLanguage(lang);
}