$images = @{
    # Existing books
    "1984.jpg" = "https://images-na.ssl-images-amazon.com/images/I/41aM4xOZxaL._SX277_BO1,204,203,200_.jpg"
    "think-and-grow-rich.jpg" = "https://images-na.ssl-images-amazon.com/images/I/71UypkUjStL.jpg"
    # New books
    "power-of-now.jpg" = "https://images-na.ssl-images-amazon.com/images/I/41WIbflfG2L._SX320_BO1,204,203,200_.jpg"
    "zero-to-one.jpg" = "https://images-na.ssl-images-amazon.com/images/I/4137OkbPQ4L._SX331_BO1,204,203,200_.jpg"
    "start-with-why.jpg" = "https://images-na.ssl-images-amazon.com/images/I/51BlNddi+NL._SX330_BO1,204,203,200_.jpg"
    "deep-work.jpg" = "https://images-na.ssl-images-amazon.com/images/I/41QoykqonNL._SX318_BO1,204,203,200_.jpg"
    "7-habits.jpg" = "https://images-na.ssl-images-amazon.com/images/I/51S1IFlzLcL._SX321_BO1,204,203,200_.jpg"
    "good-to-great.jpg" = "https://images-na.ssl-images-amazon.com/images/I/41vNjVsUWlL._SX330_BO1,204,203,200_.jpg"
    "lean-startup.jpg" = "https://images-na.ssl-images-amazon.com/images/I/51T-sMqSMiL._SX329_BO1,204,203,200_.jpg"
    "mindset.jpg" = "https://images-na.ssl-images-amazon.com/images/I/41j2-Rz1jiL._SX322_BO1,204,203,200_.jpg"
}

$outputPath = "public/images"

foreach ($image in $images.GetEnumerator()) {
    $outputFile = Join-Path $outputPath $image.Key
    Write-Host "Downloading $($image.Key)..."
    try {
        Invoke-WebRequest -Uri $image.Value -OutFile $outputFile -Headers @{
            "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        Write-Host "Downloaded to $outputFile"
    } catch {
        Write-Host "Failed to download $($image.Key). Error: $_"
        # Try alternative source from OpenLibrary if Amazon fails
        $alternativeUrls = @{
            "1984.jpg" = "https://covers.openlibrary.org/b/id/7222246-L.jpg"
            "think-and-grow-rich.jpg" = "https://covers.openlibrary.org/b/id/12009823-L.jpg"
            "power-of-now.jpg" = "https://covers.openlibrary.org/b/id/8739161-L.jpg"
            "zero-to-one.jpg" = "https://covers.openlibrary.org/b/id/7895138-L.jpg"
            "start-with-why.jpg" = "https://covers.openlibrary.org/b/id/8231990-L.jpg"
            "deep-work.jpg" = "https://covers.openlibrary.org/b/id/7895133-L.jpg"
            "7-habits.jpg" = "https://covers.openlibrary.org/b/id/8761803-L.jpg"
            "good-to-great.jpg" = "https://m.media-amazon.com/images/I/51Fp2HStS8L._SY445_SX342_.jpg"
            "lean-startup.jpg" = "https://covers.openlibrary.org/b/id/7016647-L.jpg"
            "mindset.jpg" = "https://covers.openlibrary.org/b/id/8733071-L.jpg"
        }
        
        if ($alternativeUrls.ContainsKey($image.Key)) {
            Write-Host "Trying alternative source for $($image.Key)..."
            try {
                Invoke-WebRequest -Uri $alternativeUrls[$image.Key] -OutFile $outputFile
                Write-Host "Downloaded to $outputFile from alternative source"
            } catch {
                Write-Host "Failed to download from alternative source: $_"
                # For Good to Great, use the provided image URL as final fallback
                if ($image.Key -eq "good-to-great.jpg") {
                    $finalFallbackUrl = "https://m.media-amazon.com/images/I/41vNjVsUWlL._SY445_SX342_.jpg"
                    Write-Host "Trying final fallback source for Good to Great..."
                    try {
                        Invoke-WebRequest -Uri $finalFallbackUrl -OutFile $outputFile
                        Write-Host "Downloaded to $outputFile from final fallback source"
                    } catch {
                        Write-Host "Failed to download from final fallback source: $_"
                    }
                }
            }
        }
    }
} 