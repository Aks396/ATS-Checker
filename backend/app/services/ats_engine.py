import re
from typing import Dict, Any, List

# Standard strong action verbs for resumes
ACTION_VERBS = {
    "achieved", "acquired", "adapted", "addressed", "administered", "advised", "analyzed", 
    "architected", "arranged", "assembled", "authored", "automated", "budgeted", "built", 
    "calculated", "cataloged", "championed", "clarified", "classified", "coached", "collaborated", 
    "compiled", "composed", "conceptualized", "conducted", "consolidated", "constructed", 
    "consulted", "coordinated", "created", "decided", "delegated", "delivered", "designed", 
    "determined", "developed", "devised", "directed", "distributed", "documented", "drafted", 
    "edited", "eliminated", "enabled", "engineered", "established", "evaluated", "executed", 
    "expanded", "expedited", "fabricated", "facilitated", "formulated", "founded", "generated", 
    "guided", "identified", "implemented", "improved", "increased", "indexed", "initiated", 
    "inspected", "installed", "instituted", "instructed", "integrated", "introduced", "invented", 
    "investigated", "launched", "led", "managed", "marketed", "maximized", "mediated", 
    "mentored", "merged", "minimized", "modeled", "moderated", "monitored", "negotiated", 
    "operated", "optimized", "organized", "originated", "overhauled", "oversaw", "performed", 
    "pioneered", "planned", "prepared", "presented", "prioritized", "produced", "programmed", 
    "projected", "promoted", "publicized", "purchased", "recommended", "reconciled", "recorded", 
    "recruited", "redesigned", "reduced", "regulated", "reinforced", "reorganized", "represented", 
    "researched", "resolved", "restructured", "retrieved", "revamped", "reviewed", "scheduled", 
    "screened", "selected", "served", "shaped", "simulated", "solved", "spearheaded", 
    "standardized", "stimulated", "strategized", "streamlined", "structured", "supervised", 
    "supported", "surveyed", "synthesized", "systematized", "tabulated", "taught", "tested", 
    "trained", "translated", "upgraded", "validated", "verified", "wrote"
}

def analyze_resume_ats(parsed_text: str, parsed_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a resume's ATS compatibility based on several heuristics.
    Returns scores and dynamic textual recommendations.
    """
    text_lower = parsed_text.lower()
    
    # 1. Section Completeness (Max 100)
    sections_detected = []
    section_score = 0
    
    section_patterns = {
        "Experience": ["experience", "employment", "work history", "professional background"],
        "Education": ["education", "academic", "university", "college", "school"],
        "Skills": ["skills", "core competencies", "technologies", "technical skills", "expertise"],
        "Projects": ["projects", "personal projects", "key projects", "accomplishments"],
        "Summary": ["summary", "professional summary", "about me", "profile", "objective"]
    }
    
    for section_name, patterns in section_patterns.items():
        detected = False
        # Check if the section name appears in the JSON structure first
        if section_name.lower() in parsed_json and parsed_json[section_name.lower()]:
            detected = True
        else:
            # Check text representation
            for pattern in patterns:
                if re.search(r'\b' + re.escape(pattern) + r'\b', text_lower):
                    detected = True
                    break
        if detected:
            sections_detected.append(section_name)
            section_score += 20
            
    # 2. Action Verbs Density (Max 100)
    words = re.findall(r'\b[a-zA-Z]+\b', text_lower)
    total_words = len(words)
    
    verb_count = 0
    found_verbs = set()
    for word in words:
        if word in ACTION_VERBS:
            verb_count += 1
            found_verbs.add(word)
            
    # Recommended density is 3% to 7% of total words
    verb_density = (verb_count / total_words) * 100 if total_words > 0 else 0
    if verb_density >= 4.0:
        verbs_score = 100.0
    elif verb_density >= 2.0:
        verbs_score = 80.0
    elif verb_density >= 1.0:
        verbs_score = 50.0
    else:
        verbs_score = 25.0

    # 3. Readability & Structure (Max 100)
    # Penalize if resume is too short (< 200 words) or too long (> 1500 words)
    readability_score = 100.0
    if total_words < 150:
        readability_score -= 40
    elif total_words < 250:
        readability_score -= 15
    elif total_words > 1200:
        readability_score -= 20
        
    # Check for average sentence length
    sentences = re.split(r'[.!?]+', parsed_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    avg_sentence_len = 0
    if sentences:
        total_sentence_words = sum(len(s.split()) for s in sentences)
        avg_sentence_len = total_sentence_words / len(sentences)
        
    if avg_sentence_len > 25:
        readability_score -= 15 # Too wordy
    elif avg_sentence_len < 8 and len(sentences) > 5:
        readability_score -= 10 # Too choppy
        
    readability_score = max(20.0, readability_score)

    # 4. Quantification / Experience Achievements (Max 100)
    # Check for numbers, dollar amounts, and percentages in the text
    # e.g. "20%", "$5k", "150+", "improved efficiency by 30%"
    quant_matches = re.findall(r'\b\d+%|\$\d+(?:,\d+)*(?:[kKmM])?|\b\d+\s*(?:percent|users|daily|weekly|monthly|projects|clients|employees|millions|thousands|hours)\b', parsed_text, re.IGNORECASE)
    quant_count = len(quant_matches)
    
    # Having 3 or more metric quantifiers in experience is a good standard
    if quant_count >= 6:
        quant_score = 100.0
    elif quant_count >= 3:
        quant_score = 80.0
    elif quant_count >= 1:
        quant_score = 55.0
    else:
        quant_score = 20.0

    # 5. Skills & Keyword Count (Max 100)
    skills_extracted = parsed_json.get("skills", [])
    skills_count = len(skills_extracted)
    if skills_count >= 15:
        skills_score = 100.0
    elif skills_count >= 8:
        skills_score = 85.0
    elif skills_count >= 4:
        skills_score = 60.0
    else:
        skills_score = 30.0

    # Calculate overall ATS compatibility score (weighted average)
    overall_score = round(
        (section_score * 0.25) +
        (verbs_score * 0.15) +
        (readability_score * 0.20) +
        (quant_score * 0.20) +
        (skills_score * 0.20),
        1
    )

    # Compile feedback items
    improvement_areas = []
    detailed_suggestions = []

    if "Experience" not in sections_detected:
        improvement_areas.append("Missing Work Experience Section")
        detailed_suggestions.append({
            "category": "Structure",
            "message": "Add a dedicated 'Experience' or 'Work History' section header so ATS parsers can index your professional timeline."
        })
    if "Skills" not in sections_detected:
        improvement_areas.append("Missing Skills Inventory")
        detailed_suggestions.append({
            "category": "Structure",
            "message": "Create a clear 'Skills' grid containing technical keywords relevant to target roles."
        })
        
    if verb_density < 3.0:
        improvement_areas.append("Low Action Verb Density")
        detailed_suggestions.append({
            "category": "Action Verbs",
            "message": f"Only {verb_count} action verbs were found. Replace passive phrases (e.g., 'responsible for', 'assisted with') with strong impact verbs (e.g., 'Architected', 'Spearheaded', 'Optimized')."
        })
        
    if quant_count < 3:
        improvement_areas.append("Missing Metric Quantification")
        detailed_suggestions.append({
            "category": "Quantification",
            "message": "Your experience details lack quantifiable achievements. Integrate numbers, percentages, or financial metrics (e.g., 'boosted API speeds by 40%', 'led 4 developers') to prove business impact."
        })
        
    if avg_sentence_len > 25:
        improvement_areas.append("Wordy Sentence Length")
        detailed_suggestions.append({
            "category": "Readability",
            "message": f"Your average sentence length is {avg_sentence_len:.1f} words. Keep bullet points concise (under 20 words) for improved ATS parsing and recruiter scanning."
        })

    if skills_count < 8:
        improvement_areas.append("Thin Technical Skills Profile")
        detailed_suggestions.append({
            "category": "Keywords",
            "message": f"Only {skills_count} skills were identified. Add more core tools, frameworks, and programming languages relevant to your sector."
        })

    # Default success feedback if scores are very high
    if not detailed_suggestions:
        detailed_suggestions.append({
            "category": "General",
            "message": "Excellent! Your resume exhibits great structural layout, strong action verb usage, and quantified performance indicators."
        })

    return {
        "overall_score": overall_score,
        "sub_scores": {
            "formatting": float(section_score),
            "verbs": float(verbs_score),
            "readability": float(readability_score),
            "quantification": float(quant_score),
            "skills": float(skills_score)
        },
        "metrics": {
            "word_count": total_words,
            "verb_count": verb_count,
            "verb_density_pct": round(verb_density, 2),
            "quantification_points": quant_count,
            "avg_sentence_length": round(avg_sentence_len, 1),
            "skills_count": skills_count,
            "found_verbs": list(found_verbs)[:15]
        },
        "improvement_areas": improvement_areas,
        "detailed_suggestions": detailed_suggestions
    }
