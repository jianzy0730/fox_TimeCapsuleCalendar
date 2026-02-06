from PIL import Image, ImageOps
import os

def process_app_icons(image_path, output_folder):
    # 1. 打开图片
    try:
        img = Image.open(image_path).convert("RGBA")
    except FileNotFoundError:
        print(f"错误：找不到文件 {image_path}")
        return

    # 准备输出文件夹
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    img_width, img_height = img.size
    rows, cols = 4, 4
    cell_width = img_width // cols
    cell_height = img_height // rows
    
    count = 1
    print(f"开始处理... 将输出到文件夹: {output_folder}")

    for r in range(rows):
        for c in range(cols):
            # --- 步骤 A: 切割 ---
            left = c * cell_width
            upper = r * cell_height
            cropped = img.crop((left, upper, left + cell_width, upper + cell_height))
            
            # --- 步骤 B: 制作透明底 + 黑色线条 (浅色模式用) ---
            # 原理：把原本白色的部分变透明，黑色的部分保留
            # 我们创建一个遮罩：原本越黑的地方越不透明，越白的地方越透明
            datas = cropped.getdata()
            new_data = []
            for item in datas:
                # 设定阈值，接近白色的变成透明
                if item[0] > 200 and item[1] > 200 and item[2] > 200:
                    new_data.append((255, 255, 255, 0)) # 完全透明
                else:
                    # 保留原色（黑色/深灰色），但确保不透明
                    new_data.append((0, 0, 0, 255)) 
            
            icon_light = Image.new("RGBA", cropped.size)
            icon_light.putdata(new_data)
            
            # 保存浅色模式图标
            light_name = f"icon_{count}_light.png"
            icon_light.save(os.path.join(output_folder, light_name))

            # --- 步骤 C: 制作透明底 + 白色线条 (深色模式用) ---
            # 原理：拿着刚才做好的透明底黑线条图，把黑色像素全部填成白色
            icon_dark = icon_light.copy()
            d_datas = icon_dark.getdata()
            new_d_data = []
            for item in d_datas:
                if item[3] == 0: # 如果是透明的，保持透明
                    new_d_data.append((255, 255, 255, 0))
                else:
                    # 如果有颜色（原本是线条），就变成纯白色
                    new_d_data.append((255, 255, 255, 255))
            
            icon_dark.putdata(new_d_data)
            
            # 保存深色模式图标
            dark_name = f"icon_{count}_dark.png"
            icon_dark.save(os.path.join(output_folder, dark_name))
            
            print(f"处理第 {count} 个: 已生成 {light_name} 和 {dark_name}")
            count += 1

    print("大功告成！快去 output_icons 文件夹看看吧！")

# 运行代码
# 请确保你的文件名是 'fox_icons.png'，或者修改下面的名字
process_app_icons(r"C:\Users\Jianz\Downloads\Gemini_Generated_Image_kh7eshkh7eshkh7e.png", "output_icons")