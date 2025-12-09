# 图片PDF转换工具部署指南

## 项目概述
这是一个纯前端的图片PDF转换工具，使用HTML、CSS和JavaScript实现，主要功能包括：
- 图片转PDF
- PDF转图片

项目特点：
- 纯静态文件，无需后端服务
- 使用CDN引入依赖库，无需额外安装依赖
- 轻量级，适合快速部署

## 部署方案

### 1. 选择Web服务器
对于纯静态前端项目，推荐使用以下Web服务器：

#### Nginx（推荐）
- 高性能，低资源消耗
- 优秀的静态文件处理能力
- 配置简单，易于维护
- 支持高并发（轻松处理100+并发）

#### Apache
- 稳定可靠
- 功能丰富
- 配置相对复杂

#### Caddy
- 现代Web服务器
- 自动HTTPS
- 配置简洁

### 2. 部署步骤

#### 2.1 服务器准备
- 确保Linux服务器已安装好（推荐Ubuntu 20.04或CentOS 7+）
- 确保服务器有公网IP
- 配置好防火墙规则，开放80（HTTP）和443（HTTPS）端口

#### 2.2 安装Nginx

##### Ubuntu/Debian系统
```bash
# 更新软件包列表
sudo apt update

# 安装Nginx
sudo apt install nginx

# 启动Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

##### CentOS/RHEL系统
```bash
# 安装EPEL仓库
sudo yum install epel-release

# 安装Nginx
sudo yum install nginx

# 启动Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

#### 2.3 上传项目文件

1. 在本地将项目文件打包：
```bash
# 在项目根目录执行
zip -r pic-pdf-converter.zip .
```

2. 使用scp或其他工具将打包好的文件上传到服务器：
```bash
scp pic-pdf-converter.zip user@your-server-ip:/home/user/
```

3. 在服务器上解压文件：
```bash
# 创建项目目录
sudo mkdir -p /var/www/pic-pdf-converter

# 解压文件到项目目录
sudo unzip pic-pdf-converter.zip -d /var/www/pic-pdf-converter

# 设置正确的权限
sudo chown -R www-data:www-data /var/www/pic-pdf-converter
sudo chmod -R 755 /var/www/pic-pdf-converter
```

#### 2.4 配置Nginx

1. 创建Nginx配置文件：
```bash
sudo nano /etc/nginx/sites-available/pic-pdf-converter
```

2. 粘贴以下配置（根据实际情况修改）：

##### 2.4.1 基本配置（直接部署在域名根目录）
```nginx
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名或IP地址
    root /var/www/pic-pdf-converter;
    index index.html;

    # 静态文件缓存配置
    location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 主页面
    location / {
        try_files $uri $uri/ =404;
    }
}
```

##### 2.4.2 子域名+路径配置（部署在tools.xxx.top/pic_pdf）
如果需要将项目部署在子域名的特定路径下（如tools.xxx.top/pic_pdf），使用以下配置：

```nginx
server {
    listen 80;
    server_name tools.xxx.top; # 替换为你的子域名
    
    # Gzip压缩（全局配置）
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 项目路径配置
    location /pic_pdf/ {
        # 设置静态文件根目录
        alias /var/www/pic-pdf-converter/;
        index index.html;
        
        # 静态文件缓存配置
        location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
        
        # 处理单页应用的路由问题（如果需要）
        try_files $uri $uri/ /pic_pdf/index.html;
    }
}
```

##### 2.4.3 非标准端口配置（不使用80/443端口）
如果不想使用80或443端口，可以选择其他未被占用的端口（如8080、9000等）。配置示例如下：

```nginx
server {
    listen 8080; # 替换为你想要使用的端口号
    server_name tools.xxx.top; # 替换为你的子域名或IP地址
    
    # Gzip压缩（全局配置）
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 项目路径配置（根路径部署）
    location / {
        root /var/www/pic-pdf-converter/;
        index index.html;
        
        # 静态文件缓存配置
        location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
        
        try_files $uri $uri/ =404;
    }
    
    # 或者：项目路径配置（子路径部署）
    # location /pic_pdf/ {
    #     alias /var/www/pic-pdf-converter/;
    #     index index.html;
    #     
    #     location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
    #         expires 1y;
    #         add_header Cache-Control "public, no-transform";
    #     }
    #     
    #     try_files $uri $uri/ /pic_pdf/index.html;
    # }
}
```

###### 2.4.3.1 非标准端口配置注意事项

1. **端口选择**：
   - 选择1024以上的端口（1024以下的端口需要root权限）
   - 确保所选端口未被其他服务占用，可使用`netstat -tuln`或`ss -tuln`命令查看
   - 常用的非标准端口：8080、8888、9000、9090等

2. **防火墙设置**：
   - 需要开放所选的非标准端口，否则外部无法访问
   - Ubuntu/Debian系统：
     ```bash
     sudo ufw allow 8080/tcp  # 替换为你的端口号
     sudo ufw reload
     ```
   - CentOS/RHEL系统：
     ```bash
     sudo firewall-cmd --permanent --add-port=8080/tcp  # 替换为你的端口号
     sudo firewall-cmd --reload
     ```

3. **访问方式**：
   - 使用非标准端口时，访问URL需要包含端口号
   - 根路径部署：`http://tools.xxx.top:8080/`或`http://your-server-ip:8080/`
   - 子路径部署：`http://tools.xxx.top:8080/pic_pdf/`或`http://your-server-ip:8080/pic_pdf/`

4. **反向代理配置**：
   - 如果使用反向代理（如Cloudflare、Nginx反向代理），需要配置代理规则，将请求转发到对应的非标准端口
   - 示例：使用另一个Nginx实例作为反向代理
     ```nginx
     server {
         listen 80;
         server_name tools.xxx.top;
         
         location /pic_pdf/ {
             proxy_pass http://localhost:8080/pic_pdf/;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_set_header X-Forwarded-Proto $scheme;
         }
     }
     ```

5. **安全性考虑**：
   - 确保所选端口不被恶意扫描或攻击
   - 考虑使用防火墙限制访问来源
   - 如果处理敏感数据，建议使用HTTPS，即使使用非标准端口

6. **HTTPS配置**：
   - 可以为非标准端口配置HTTPS，需要修改listen指令：
     ```nginx
     server {
         listen 8443 ssl;
         server_name tools.xxx.top;
         
         # SSL证书配置
         ssl_certificate /path/to/cert.pem;
         ssl_certificate_key /path/to/key.pem;
         
         # 其他配置...
     }
     ```
   - 访问时使用`https://tools.xxx.top:8443/pic_pdf/`

3. 启用配置文件：
```bash
sudo ln -s /etc/nginx/sites-available/pic-pdf-converter /etc/nginx/sites-enabled/
```

4. 检查Nginx配置是否正确：
```bash
sudo nginx -t
```

5. 重启Nginx：
```bash
sudo systemctl restart nginx
```

#### 2.5 配置HTTPS（可选但推荐）

使用Let's Encrypt获取免费SSL证书：

1. 安装Certbot：
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

2. 获取并配置SSL证书：
```bash
sudo certbot --nginx -d your-domain.com
```

3. 按照提示完成配置，Certbot会自动更新Nginx配置并启用HTTPS

### 3. 性能优化

#### 3.1 Nginx性能优化

编辑Nginx主配置文件：
```bash
sudo nano /etc/nginx/nginx.conf
```

在`http`块中添加或修改以下配置：

```nginx
# 工作进程数，建议设置为CPU核心数
worker_processes auto;

# 每个工作进程的最大连接数
worker_connections 1024;

# 启用epoll事件模型
events {
    use epoll;
    worker_connections 1024;
}

# 启用sendfile优化静态文件传输
sendfile on;

# 启用TCP_NOPUSH，与sendfile配合使用
tcp_nopush on;

# 启用TCP_NODELAY
tcp_nodelay on;

# 保持连接超时时间
keepalive_timeout 65;

# 保持连接请求数上限
keepalive_requests 100;
```

重启Nginx使配置生效：
```bash
sudo systemctl restart nginx
```

#### 3.2 前端资源优化

该项目已经使用CDN引入依赖库，无需额外优化。如果需要进一步优化，可以考虑：

1. 压缩HTML、CSS和JavaScript文件
2. 优化图片资源（如果有）
3. 使用更高效的CDN服务

### 4. 监控和维护

#### 4.1 监控Nginx状态

1. 启用Nginx状态模块：
在Nginx配置文件中添加：
```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

2. 重启Nginx后，可以通过`curl http://localhost/nginx_status`查看状态

#### 4.2 查看Nginx日志

- 访问日志：`/var/log/nginx/access.log`
- 错误日志：`/var/log/nginx/error.log`

使用`tail`命令实时查看日志：
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 5. 扩展建议

如果未来需要支持更多并发或功能，可以考虑：

1. 使用负载均衡器（如Nginx反向代理、HAProxy）
2. 部署多个服务器节点
3. 使用CDN加速静态资源
4. 添加缓存层（如Redis）
5. 考虑将PDF处理逻辑迁移到后端（如果前端处理能力不足）

## 常见问题

### Q: 访问网站时出现403 Forbidden错误
A: 检查文件权限是否正确，确保Nginx进程可以访问项目文件。

### Q: 访问网站时出现502 Bad Gateway错误
A: 检查Nginx配置是否正确，特别是反向代理配置（如果有）。

### Q: SSL证书过期怎么办？
A: 使用Certbot自动续期：
```bash
sudo certbot renew --dry-run  # 测试续期
sudo certbot renew            # 实际续期
```

### Q: 如何升级Nginx？
A: 使用系统包管理器升级：
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade nginx

# CentOS/RHEL
sudo yum update nginx
```

## 总结

本部署方案使用Nginx作为Web服务器，适合部署纯静态前端项目，能够轻松支持100+并发。通过合理的配置和优化，可以确保网站的稳定性和性能。

部署完成后，你可以通过以下方式访问网站：
- HTTP: http://your-domain.com 或 http://your-server-ip
- HTTPS: https://your-domain.com（如果配置了SSL证书）