#!/bin/bash

# Image Optimization Script using sharp CLI or cwebp
# Usage: ./optimize-images.sh

set -e

IMAGES_DIR="../public/images"

echo "?? Starting image optimization..."
echo ""

# Check for sharp CLI
check_sharp() {
  if command -v npx &> /dev/null && npx sharp --version &> /dev/null; then
    return 0
  fi
  return 1
}

# Check for cwebp
check_cwebp() {
  if command -v cwebp &> /dev/null; then
    return 0
  fi
  return 1
}

# Convert using sharp
convert_with_sharp() {
  local input="$1"
  local output="${input%.jpg}.webp"
  
  echo "Converting: $input -> $output"
  npx sharp "$input" --webp "{ quality: 85, effort: 6 }" --output "$output"
}

# Convert using cwebp
convert_with_cwebp() {
  local input="$1"
  local output="${input%.jpg}.webp"
  
  echo "Converting: $input -> $output"
  cwebp -q 85 -m 6 "$input" -o "$output"
}

# Main conversion
convert_image() {
  local input="$1"
  
  if check_sharp; then
    convert_with_sharp "$input"
  elif check_cwebp; then
    convert_with_cwebp "$input"
  else
    echo "? No conversion tool found. Install sharp or cwebp."
    echo "   npm install -g sharp-cli"
    echo "   or"
    echo "   Install webp from https://developers.google.com/speed/webp/download"
    exit 1
  fi
}

# JPEG files to convert
jpeg_files=(
  "logo-wordmark.jpg"
  "logo-full.jpg"
  "logo-icon.jpg"
  "logo-sparkle.jpg"
)

cd "$IMAGES_DIR" || exit 1

for file in "${jpeg_files[@]}"; do
  if [ -f "$file" ]; then
    convert_image "$file"
    
    # Show size comparison
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    webp_file="${file%.jpg}.webp"
    if [ -f "$webp_file" ]; then
      webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file")
      savings=$(echo "scale=1; ($original_size - $webp_size) * 100 / $original_size" | bc)
      echo "   Original: $(($original_size / 1024)) KB"
      echo "   WebP: $(($webp_size / 1024)) KB"
      echo "   Savings: ${savings}%"
    fi
    echo ""
  else
    echo "??  File not found: $file"
  fi
done

echo "? Optimization complete!"
echo ""
echo "Next steps:"
echo "1. Verify the WebP files were created"
echo "2. Update references in your code to use WebP with JPEG fallback"
echo "3. Keep original JPEG files as fallbacks for older browsers"
