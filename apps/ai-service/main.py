import ollama

def generate_response(prompt):
    """
    Generates a response from the llava-deckbot model.
    """
    try:
        response = ollama.chat(model='llava-deckbot', messages=[
            {
                'role': 'user',
                'content': prompt,
            },
        ])
        return response['message']['content']
    except Exception as e:
        return f"Error interacting with Ollama: {e}"

if __name__ == "__main__":
    test_prompt = "What are the key dimensions in this blueprint?"
    print(f"Sending prompt: {test_prompt}")
    response_content = generate_response(test_prompt)
    print(f"Received response: {response_content}")
