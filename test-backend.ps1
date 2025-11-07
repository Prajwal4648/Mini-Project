$body = @{
    code = @"
public class Test {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
"@
    language = "java"
    versionIndex = "4"
} | ConvertTo-Json

Write-Host "Testing backend API..." -ForegroundColor Cyan
Write-Host "Endpoint: POST http://localhost:3001/api/compile" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/compile" -Method Post -Body $body -ContentType "application/json"
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Output:" -ForegroundColor Green
    Write-Host $response.output
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
