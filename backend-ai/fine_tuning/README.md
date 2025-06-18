# Fine-Tuning LLaVA-LLaMA3 with ShareGPT4V and InternVL

This directory provides scripts and instructions to:
- Prepare the ShareGPT4V dataset into LLaVA visual-chat format
- Fine-tune the model using InternLM's XTuner toolkit
- Run inference on the fine-tuned model

## 1. Data Preparation (prepare_sharegpt4v.py)

```python
import json
from datasets import load_dataset

splits = {
    'sharegpt4v_100k': 'sharegpt4v_instruct_gpt4-vision_cap100k',
    'share_captioner_1246k': 'share-captioner_coco_lcs_sam_1246k_1107'
}

dialogs = []
for name, hf_name in splits.items():
    ds = load_dataset('Lin-Chen/ShareGPT4V', name=hf_name)
    formatted = []
    for ex in ds:
        formatted.append([
            {'from': 'human', 'value': ex['question'].replace('<ImageHere>', '<image>')},
            {'from': 'gpt', 'value': ex['caption']}
        ])
    with open(f'{name}.json', 'w', encoding='utf-8') as f:
        json.dump(formatted, f, ensure_ascii=False, indent=2)
```

## 2. Fine-Tuning Script (finetune_llava.sh)

```bash
#!/usr/bin/env bash

# Fine-tune LLaVA-LLaMA3 on ShareGPT4V and InternVL data using XTuner
xtuner finetune \
  --model meta-llama/Meta-Llama-3-8B-Instruct \
  --visual_model CLIP-ViT-L-336 \
  --data_sharegpt4v sharegpt4v_100k.json \
  --data_share_captioner share_captioner_1246k.json \
  --output_dir llava-llama3-finetuned
```

## 3. Inference Helper (process_image.py)

```python
import sys
import json
from PIL import Image
from transformers import pipeline

MODEL_ID = 'xtuner/llava-llama3-finetuned'
DEVICE = 0  # GPU device ID, or -1 for CPU

def main(image_path):
    pipe = pipeline('image-to-text', model=MODEL_ID, device=DEVICE)
    img = Image.open(image_path)
    prompt = (
        '<|start_header_id|>user<|end_header_id|>\n\n'
        '<image>\n'
        'Describe this deck plan with measurements and blueprint:<|eot_id|>\n'
        '<|start_header_id|>assistant<|end_header_id|>'
    )
    out = pipe(img, prompt=prompt, generate_kwargs={'max_new_tokens': 200})
    print(json.dumps({'caption': out[0]['generated_text']}))

if __name__ == '__main__':
    main(sys.argv[1])
```