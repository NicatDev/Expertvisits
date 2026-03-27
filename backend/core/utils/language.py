from langdetect import detect, detect_langs

def detect_language(text):
    """
    Detects the language of the provided text (Title or Body).
    Gives priority to Azerbaijani based on specific keywords.
    """
    if not text or len(text.strip()) < 5:
        return 'az' # Default fallback
    
    text_lower = text.lower()
    
    # Specific Azerbaijani function words to avoid confusion with Turkish or others
    AZ_WORDS = ["və", "üçün", "ilə", "amma", "kimi", "daha", "çox", "bu", "həmin"]
    
    # Check for presence of Azerbaijani specific words
    words = text_lower.split()
    az_count = sum(1 for word in words if word in AZ_WORDS)
    
    # If at least 1-2 distinct AZ words are found, highly likely it's Azerbaijani
    if az_count >= 1:
        return 'az'
    
    try:
        # Fallback to general detection (langdetect)
        lang = detect(text)
        
        # langdetect returns 'az' for Azerbaijani, 'ru' for Russian, 'en' for English
        if lang in ['az', 'en', 'ru']:
            return lang
            
    except:
        pass
        
    return 'az' # Default to 'az' if detection fails
