# PowerShell script to test user registration endpoint

# Test registration with all fields
$body = @{
    full_name = "John Doe"
    date_of_birth = "1990-01-15"
    age = 34
    gender = "Male"
    civil_status = "Single"
    address = "123 Main Street, City, Country"
    contact_number = "+1234567890"
    email_address = "john.doe@example.com"
    emergency_contact_person_number = "Jane Doe - +1234567891"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/register" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

