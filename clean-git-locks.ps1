# Git锁文件清理脚本
Write-Host "正在清理Git锁文件..." -ForegroundColor Yellow

# 检查是否存在锁文件
$lockFiles = Get-ChildItem -Path ".git" -Name "*.lock" -Force -ErrorAction SilentlyContinue

if ($lockFiles) {
    Write-Host "发现以下锁文件:" -ForegroundColor Red
    $lockFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    
    # 删除锁文件
    Remove-Item -Path ".git/*.lock" -Force
    Write-Host "锁文件已清理完成!" -ForegroundColor Green
} else {
    Write-Host "没有发现锁文件，Git状态正常。" -ForegroundColor Green
}

# 检查Git状态
Write-Host "`n检查Git状态..." -ForegroundColor Yellow
git status --porcelain
