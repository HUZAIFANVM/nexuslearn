from langchain_groq import ChatGroq
from config import settings

global_llm = ChatGroq(
    groq_api_key=settings.GROQ_API_KEY,
    model_name="meta-llama/llama-4-scout-17b-16e-instruct",
    temperature=0.2,
)

streaming_llm = ChatGroq(
    groq_api_key=settings.GROQ_API_KEY,
    model_name="meta-llama/llama-4-scout-17b-16e-instruct",
    temperature=0.2,
    streaming=True,
)

print("Global Groq LLM initialized (standard + streaming)")
