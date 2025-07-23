class PasswordGenerator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadHistory();
        this.loadTheme();
    }

    initializeElements() {
        // 控制元素
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.includeUppercase = document.getElementById('includeUppercase');
        this.includeLowercase = document.getElementById('includeLowercase');
        this.includeNumbers = document.getElementById('includeNumbers');
        this.includeSymbols = document.getElementById('includeSymbols');
        this.excludeSimilar = document.getElementById('excludeSimilar');
        this.excludeSequential = document.getElementById('excludeSequential');

        // 密码相关元素
        this.passwordOutput = document.getElementById('passwordOutput');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyPassword = document.getElementById('copyPassword');
        this.toggleVisibility = document.getElementById('toggleVisibility');
        this.generateQR = document.getElementById('generateQR');

        // 强度指示器
        this.strengthFill = document.getElementById('strengthFill');
        this.strengthText = document.getElementById('strengthText');

        // 历史记录
        this.historyList = document.getElementById('historyList');
        this.clearHistory = document.getElementById('clearHistory');

        // 主题切换
        this.themeToggle = document.getElementById('themeToggle');

        // 二维码模态框
        this.qrModal = document.getElementById('qrModal');
        this.qrClose = document.getElementById('qrClose');
        this.qrCodeContainer = document.getElementById('qrCodeContainer');
    }

    setupEventListeners() {
        // 长度滑块
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthValue.textContent = e.target.value;
            if (this.passwordOutput.value) {
                this.generatePassword();
            }
        });

        // 复选框变化时重新生成密码
        [this.includeUppercase, this.includeLowercase, this.includeNumbers, 
         this.includeSymbols, this.excludeSimilar, this.excludeSequential].forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (this.passwordOutput.value) {
                    this.generatePassword();
                }
            });
        });

        // 生成密码按钮
        this.generateBtn.addEventListener('click', () => {
            this.generatePassword();
            this.generateBtn.classList.add('pulse');
            setTimeout(() => this.generateBtn.classList.remove('pulse'), 300);
        });

        // 复制密码
        this.copyPassword.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // 显示/隐藏密码
        this.toggleVisibility.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // 生成二维码
        this.generateQR.addEventListener('click', () => {
            this.generateQRCode();
        });

        // 清空历史
        this.clearHistory.addEventListener('click', () => {
            this.clearPasswordHistory();
        });

        // 主题切换
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 二维码模态框
        this.qrClose.addEventListener('click', () => {
            this.qrModal.style.display = 'none';
        });

        this.qrModal.addEventListener('click', (e) => {
            if (e.target === this.qrModal) {
                this.qrModal.style.display = 'none';
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.generatePassword();
            }
            if (e.ctrlKey && e.key === 'c' && this.passwordOutput.value) {
                this.copyToClipboard();
            }
        });
    }

    generatePassword() {
        const options = this.getPasswordOptions();
        
        if (!this.validateOptions(options)) {
            alert('请至少选择一种字符类型！');
            return;
        }

        const charset = this.buildCharset(options);
        let password = '';

        // 确保至少包含每种选中的字符类型
        if (options.includeUppercase) password += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ', options);
        if (options.includeLowercase) password += this.getRandomChar('abcdefghijklmnopqrstuvwxyz', options);
        if (options.includeNumbers) password += this.getRandomChar('0123456789', options);
        if (options.includeSymbols) password += this.getRandomChar('!@#$%^&*()_+-=[]{}|;:,.<>?', options);

        // 填充剩余长度
        while (password.length < options.length) {
            const char = this.getRandomChar(charset, options);
            if (this.isValidChar(char, password, options)) {
                password += char;
            }
        }

        // 打乱密码顺序
        password = this.shuffleString(password);

        this.passwordOutput.value = password;
        this.evaluatePasswordStrength(password);
        this.addToHistory(password);
    }

    getPasswordOptions() {
        return {
            length: parseInt(this.lengthSlider.value),
            includeUppercase: this.includeUppercase.checked,
            includeLowercase: this.includeLowercase.checked,
            includeNumbers: this.includeNumbers.checked,
            includeSymbols: this.includeSymbols.checked,
            excludeSimilar: this.excludeSimilar.checked,
            excludeSequential: this.excludeSequential.checked
        };
    }

    validateOptions(options) {
        return options.includeUppercase || options.includeLowercase || 
               options.includeNumbers || options.includeSymbols;
    }

    buildCharset(options) {
        let charset = '';
        
        if (options.includeUppercase) {
            charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        
        if (options.includeLowercase) {
            charset += 'abcdefghijklmnopqrstuvwxyz';
        }
        
        if (options.includeNumbers) {
            charset += '0123456789';
        }
        
        if (options.includeSymbols) {
            charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        // 排除易混淆字符
        if (options.excludeSimilar) {
            const similarChars = '0oO1lI';
            charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
        }

        return charset;
    }

    getRandomChar(charset, options) {
        if (options.excludeSimilar) {
            const similarChars = '0oO1lI';
            charset = charset.split('').filter(char => !similarChars.includes(char)).join('');
        }
        
        return charset[Math.floor(Math.random() * charset.length)];
    }

    isValidChar(char, currentPassword, options) {
        if (!options.excludeSequential) return true;

        if (currentPassword.length < 2) return true;

        const lastChar = currentPassword[currentPassword.length - 1];
        const secondLastChar = currentPassword[currentPassword.length - 2];

        // 检查连续字符
        const isSequential = (
            char.charCodeAt(0) === lastChar.charCodeAt(0) + 1 &&
            lastChar.charCodeAt(0) === secondLastChar.charCodeAt(0) + 1
        ) || (
            char.charCodeAt(0) === lastChar.charCodeAt(0) - 1 &&
            lastChar.charCodeAt(0) === secondLastChar.charCodeAt(0) - 1
        );

        return !isSequential;
    }

    shuffleString(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    evaluatePasswordStrength(password) {
        let score = 0;
        let feedback = '';

        // 长度评分
        if (password.length >= 12) score += 25;
        else if (password.length >= 8) score += 15;
        else if (password.length >= 6) score += 5;

        // 字符类型评分
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[^a-zA-Z0-9]/.test(password)) score += 15;

        // 复杂度评分
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.8) score += 10;
        else if (uniqueChars >= password.length * 0.6) score += 5;

        // 熵值评分
        const entropy = this.calculateEntropy(password);
        if (entropy >= 60) score += 20;
        else if (entropy >= 40) score += 10;
        else if (entropy >= 25) score += 5;

        // 设置强度等级和颜色
        let strengthClass = '';
        let strengthText = '';

        if (score >= 85) {
            strengthClass = 'strength-strong';
            strengthText = '非常强';
        } else if (score >= 70) {
            strengthClass = 'strength-good';
            strengthText = '强';
        } else if (score >= 50) {
            strengthClass = 'strength-fair';
            strengthText = '一般';
        } else if (score >= 30) {
            strengthClass = 'strength-weak';
            strengthText = '弱';
        } else {
            strengthClass = 'strength-very-weak';
            strengthText = '非常弱';
        }

        // 更新UI
        this.strengthFill.className = `strength-fill ${strengthClass}`;
        this.strengthFill.style.width = `${Math.min(score, 100)}%`;
        this.strengthText.textContent = `密码强度: ${strengthText} (${score}/100)`;
    }

    calculateEntropy(password) {
        const charset = new Set(password).size;
        return password.length * Math.log2(charset);
    }

    copyToClipboard() {
        if (!this.passwordOutput.value) {
            alert('请先生成密码！');
            return;
        }

        navigator.clipboard.writeText(this.passwordOutput.value).then(() => {
            // 显示复制成功反馈
            const originalIcon = this.copyPassword.innerHTML;
            this.copyPassword.innerHTML = '<i class="fas fa-check"></i>';
            this.copyPassword.style.color = 'var(--success-color)';
            
            setTimeout(() => {
                this.copyPassword.innerHTML = originalIcon;
                this.copyPassword.style.color = '';
            }, 2000);
        }).catch(() => {
            // 备用复制方法
            this.passwordOutput.select();
            document.execCommand('copy');
            alert('密码已复制到剪贴板！');
        });
    }

    togglePasswordVisibility() {
        const isHidden = this.passwordOutput.type === 'password';
        this.passwordOutput.type = isHidden ? 'text' : 'password';
        
        const icon = this.toggleVisibility.querySelector('i');
        icon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
    }

    generateQRCode() {
        if (!this.passwordOutput.value) {
            alert('请先生成密码！');
            return;
        }

        this.qrCodeContainer.innerHTML = '';
        
        QRCode.toCanvas(this.passwordOutput.value, {
            width: 200,
            height: 200,
            colorDark: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
            colorLight: getComputedStyle(document.documentElement).getPropertyValue('--card-background').trim(),
        }, (error, canvas) => {
            if (error) {
                console.error('生成二维码失败:', error);
                alert('生成二维码失败！');
                return;
            }
            
            this.qrCodeContainer.appendChild(canvas);
            this.qrModal.style.display = 'block';
        });
    }

    addToHistory(password) {
        let history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        
        const historyItem = {
            password: password,
            timestamp: new Date().toISOString(),
            strength: this.strengthText.textContent
        };

        // 避免重复
        if (!history.some(item => item.password === password)) {
            history.unshift(historyItem);
            
            // 限制历史记录数量
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('passwordHistory', JSON.stringify(history));
            this.renderHistory();
        }
    }

    loadHistory() {
        this.renderHistory();
    }

    renderHistory() {
        const history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">暂无生成记录</p>';
            return;
        }

        this.historyList.innerHTML = history.map(item => `
            <div class="history-item fade-in">
                <div class="history-password">${this.maskPassword(item.password)}</div>
                <div class="history-info">
                    <div>${new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                    <div>${item.strength}</div>
                </div>
                <button class="action-btn" onclick="passwordGen.copyHistoryPassword('${item.password}')" title="复制">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `).join('');
    }

    maskPassword(password) {
        if (password.length <= 8) {
            return '*'.repeat(password.length);
        }
        return password.substring(0, 3) + '*'.repeat(password.length - 6) + password.substring(password.length - 3);
    }

    copyHistoryPassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            // 可以添加复制成功的提示
        });
    }

    clearPasswordHistory() {
        if (confirm('确定要清空所有密码历史记录吗？')) {
            localStorage.removeItem('passwordHistory');
            this.renderHistory();
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // 更新图标
        const icon = this.themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = this.themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// 初始化应用
const passwordGen = new PasswordGenerator();

// 页面加载完成后自动生成一个密码
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        passwordGen.generatePassword();
    }, 500);
});