document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 欢迎来到私人放映厅。前端样式已成功加载！');

    // ==================== 1. 归档页分类标签高亮交互 ====================
    const tagButtons = document.querySelectorAll('.tag-btn');
    if (tagButtons.length > 0) {
        tagButtons.forEach(button => {
            button.addEventListener('click', () => {
                tagButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // TODO: 以后可以在这里过滤页面上的卡片显示
            });
        });
    }

    // ==================== 2. 详情页动态数据拉取 ====================
    // 判断当前是否在详情页（可以通过检查页面上是否有电影标题的 ID 输出来判断）
    const movieTitleEl = document.getElementById('movie-title');

    if (movieTitleEl) {
        // 从 URL 中获取参数，例如 detail.html?id=1 中的 1
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            movieTitleEl.textContent = "未找到该影评";
            return;
        }

        // 调用 Cloudflare Workers 的 API 接口
        // 本地开发时默认使用线上 API（因为本地 KV 存储为空）
        // 如果需要测试本地 Worker，请确保已启动并导入数据到本地 KV
        const apiUrl = `https://my-movie-api.zhentan2004.workers.dev/api/review?id=${movieId}`;

        // 发起异步请求
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('网络请求失败');
                return response.json();
            })
            .then(data => {
                // 成功拿到数据后，动态塞进我们刚刚改好的 HTML 占位符里
                document.getElementById('movie-title').textContent = data.title;
                document.getElementById('movie-rating').textContent = `个人评分 ${data.rating}`;
                document.getElementById('movie-date').textContent = `发布日期: ${data.date}`;
                document.getElementById('movie-category').textContent = `分类: ${data.category}`;

                // 如果有大图，也可以动态改背景
                if (data.heroImage) {
                    const heroEl = document.querySelector('.movie-hero');
                    if (heroEl) heroEl.style.backgroundImage = `linear-gradient(to bottom, rgba(10,10,12,0) 30%, #0a0a0c 100%), url('${data.heroImage}')`;
                }

                // 填入正文内容（支持 HTML 标签，如含有 <p> 或 <blockquote> 的影评）
                document.getElementById('movie-content').innerHTML = data.content;
            })
            .catch(error => {
                console.error('获取影评出错:', error);
                // 暂时用本地模拟数据兜底，方便你现在本地测试不报错
                showMockData(movieId);
            });
    }

    // ==================== 3. 首页动态生成卡片列表 ====================
    // 功能：从后端获取所有电影列表，动态生成首页的影评卡片
    // 适用页面：index.html（首页）
    const homeGrid = document.getElementById('home-review-grid');
    
    if (homeGrid) {
        // 默认使用生产环境 API（本地 KV 存储通常为空）
        // 如需测试本地 Worker，请确保已启动并导入数据
        const apiBaseUrl = 'https://my-movie-api.zhentan2004.workers.dev';

        // 请求我们刚刚在 Worker 里新增的获取全部列表的接口 (/api/reviews)
        fetch(`${apiBaseUrl}/api/reviews`)
            .then(res => {
                // 检查响应状态码
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // 清空"正在加载..."的提示
                homeGrid.innerHTML = '';

                // 限制只显示前 6 篇最新影评（符合项目规范）
                const latestReviews = data.slice(0, 6);

                // 遍历获取到的电影数组，动态生成 HTML 卡片
                latestReviews.forEach(movie => {
                    // 创建卡片 HTML 结构
                    // 注意：这里使用模板字符串动态插入数据
                    const html = `
                        <article class="review-card">
                            <a href="detail.html?id=${movie.id}">
                                <div class="card-image">
                                    <img src="${movie.heroImage || 'https://picsum.photos/600/400'}" alt="${movie.title || '电影剧照'}">
                                </div>
                                <div class="card-content">
                                    <div class="card-meta">
                                        <span>${movie.rating || '暂无评分'}</span>
                                        <span>${movie.date || ''}</span>
                                    </div>
                                    <h2 class="card-title">${movie.title || '无标题'}</h2>
                                    <p class="card-excerpt">${movie.category || '电影分类'}</p>
                                </div>
                            </a>
                        </article>
                    `;
                    // 将生成的卡片追加到网格容器中
                    homeGrid.innerHTML += html;
                });

                console.log(`✅ 首页成功加载 ${latestReviews.length} 篇影评`);
            })
            .catch(err => {
                console.error("❌ 首页数据拉取失败:", err);
                // 显示错误提示信息
                homeGrid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">无法加载影评列表，请检查网络或后端状态。</p>';
            });
    }
});

// 本地模拟数据函数（在还未部署 Worker 时，让网页点击能正常看到效果）
function showMockData(id) {
    const mockDB = {
        "1": {
            title: "斯人若彩虹，遇上方知有 ——《怦然心动》深度解读",
            rating: "5.0 / 5.0",
            date: "2026-06-18",
            category: "治愈 / 情感",
            heroImage: "https://picsum.photos/1200/600?random=50",
            content: `<p>这是动态加载出来的第一部电影正文。</p><blockquote><p>"有些人浅薄，有些人金玉其外败絮其中...."</p></blockquote><p>听着轻柔的音乐，敲下这些代码...</p>`
        },
        "2": {
            title: "在四季轮回中找到自己 ——《小森林》",
            rating: "4.5 / 5.0",
            date: "2026-06-05",
            category: "乡村 / 治愈",
            heroImage: "https://picsum.photos/1200/600?random=51",
            content: `<p>逃离都市的喧嚣，回到乡村自给自足的生活。动态加载出来的第二部电影正文。</p>`
        }
    };

    const data = mockDB[id];
    if (data) {
        document.getElementById('movie-title').textContent = data.title;
        document.getElementById('movie-rating').textContent = `个人评分 ${data.rating}`;
        document.getElementById('movie-date').textContent = `发布日期: ${data.date}`;
        document.getElementById('movie-category').textContent = `分类: ${data.category}`;
        const heroEl = document.querySelector('.movie-hero');
        if (heroEl) heroEl.style.backgroundImage = `linear-gradient(to bottom, rgba(10,10,12,0) 30%, #0a0a0c 100%), url('${data.heroImage}')`;
        document.getElementById('movie-content').innerHTML = data.content;
    } else {
        document.getElementById('movie-title').textContent = "电影影评不存在";
    }
}