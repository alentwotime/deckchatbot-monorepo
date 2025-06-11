# Save this as duckdns.ps1
$Token = "3089e01d-fb9d-4484-a53e-4c1088df910e"
$Domain = "mydeckingbot"

$URL = "https://www.duckdns.org/update?domains=$Domain&token=$Token&ip="

Invoke-RestMethod -Uri $URL
