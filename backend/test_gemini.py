import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def test_api():
    print("Testing Gemini API...")
    try:
        llm = ChatGoogleGenerativeAI(
            model='gemini-1.5-flash',
            google_api_key=os.getenv('GEMINI_API_KEY')
        )
        res = llm.invoke("Say Hello")
        print("Success! Response:")
        print(res.content)
    except Exception as e:
        print("Failed to invoke Gemini:")
        print(e)

if __name__ == "__main__":
    test_api()
