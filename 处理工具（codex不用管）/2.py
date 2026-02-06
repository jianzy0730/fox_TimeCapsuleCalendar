from PIL import Image, ImageFilter
import os

def split_and_make_white_transparent(
    image_path,
    output_folder,
    rows=4,
    cols=4,
    tolerance=15,     # 0=只纯白；10~25=去掉近白噪点
    feather=20,       # 0=不羽化；10~40=边缘更柔
    denoise=True      # alpha 通道去噪
):
    img = Image.open(image_path).convert("RGBA")
    os.makedirs(output_folder, exist_ok=True)

    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows

    count = 1
    for r in range(rows):
        for c in range(cols):
            left = c * cell_w
            upper = r * cell_h
            right = (c + 1) * cell_w if c < cols - 1 else w
            lower = (r + 1) * cell_h if r < rows - 1 else h

            cropped = img.crop((left, upper, right, lower)).convert("RGBA")

            pixels = list(cropped.getdata())
            new_pixels = []

            thr = 255 - int(tolerance)
            # feather=0 时不需要羽化，thr2 设成 thr 避免多余分支
            thr2 = thr if feather <= 0 else max(0, thr - int(feather))

            for (R, G, B, A) in pixels:
                m = min(R, G, B)  # 越接近255越白

                if m >= thr:
                    newA = 0
                elif feather > 0 and m >= thr2:
                    # 羽化：m=thr -> 0, m=thr2 -> 255
                    denom = (thr - thr2) if (thr - thr2) != 0 else 1
                    t = (thr - m) / denom
                    newA = int(255 * t)
                else:
                    newA = A

                new_pixels.append((R, G, B, newA))

            out = Image.new("RGBA", cropped.size)
            out.putdata(new_pixels)

            if denoise:
                alpha = out.getchannel("A")

                # 中值滤波：去椒盐小点（3 或 5）
                alpha = alpha.filter(ImageFilter.MedianFilter(3))

                # 轻度开运算：擦掉孤立小点（3比较温和，5更强）
                alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))

                out.putalpha(alpha)

            out_name = f"icon_{count}.png"
            out.save(os.path.join(output_folder, out_name))
            count += 1

    print("完成！")


# ✅ 方案1：严格“只纯白透明”（不吃近白）
split_and_make_white_transparent(
    r"C:\Users\Jianz\Downloads\Gemini_Generated_Image_9l065l9l065l9l06.png",
    "output_icons",
    rows=4,
    cols=4,
    tolerance=5,
    feather=10,     # 关键：要严格就把羽化关掉
    denoise=True
)

# ✅ 方案2：推荐“去噪更干净”（吃掉近白）
# split_and_make_white_transparent(
#     r"C:\Users\Jianz\Downloads\Gemini_Generated_Image_kh7eshkh7eshkh7e.png",
#     "output_icons",
#     rows=4,
#     cols=4,
#     tolerance=15,
#     feather=20,
#     denoise=True
# )
