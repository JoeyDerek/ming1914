# 大明1914

一个架空历史 wiki，记录“大明在李自成攻破北京后于南京抵抗、重新统一中国、完成近代化改革并延续到一次世界大战”的历史设定。

本仓库采用 Markdown 写作，网页由 `docs/` 目录发布为 GitHub Pages。任何人都可以通过 issue 或 pull request 参与补充条目、修订年表和讨论设定。

## 阅读入口

- [Wiki 首页](docs/home.md)
- [总年表](docs/timeline.md)
- [设定原则](docs/canon.md)
- [北京陷落后大明皇帝年表](docs/people/emperors-after-1644.md)
- [党派政治](docs/politics/party-politics.md)

## 本地预览

```bash
cd docs
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 发布到 GitHub Pages

推荐使用仓库自带的 GitHub Actions 工作流：

1. 把仓库推送到 GitHub。
2. 在仓库设置中启用 GitHub Pages。
3. Source 选择 `GitHub Actions`。
4. 推送到 `main` 后，GitHub 会自动发布 `docs/` 中的 wiki。

也可以不用 Actions，直接在 GitHub Pages 设置里选择从 `main` 分支的 `/docs` 目录发布。

## 贡献方式

请先阅读 [贡献指南](CONTRIBUTING.md)。新增条目时尽量：

- 使用相对 Markdown 链接连接相关条目。
- 把确定设定写进正文，把待讨论内容放进“待定”小节。
- 保持条目短小清楚，避免一次性重写无关页面。
