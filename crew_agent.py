import os
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI

# Simple text analysis agent without external LLM dependencies
def create_content_crew(topic):
    """Create a crew for content analysis and creation"""
    
    # Get API key from environment
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is required")
    
    # Initialize the LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )
    
    # Content Research Agent
    researcher = Agent(
        role='Content Researcher',
        goal='Research and analyze the given topic thoroughly',
        backstory="""You are an expert content researcher with years of experience in 
        analyzing topics and gathering comprehensive information. You excel at breaking down 
        complex subjects into understandable insights.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Content Writer Agent
    writer = Agent(
        role='Content Writer',
        goal='Create engaging and informative content based on research',
        backstory="""You are a skilled content writer who specializes in creating 
        clear, engaging, and well-structured content. You have a talent for making 
        complex information accessible to readers.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Content Review Agent
    reviewer = Agent(
        role='Content Reviewer',
        goal='Review and improve the quality of written content',
        backstory="""You are a meticulous content reviewer with an eye for detail. 
        You ensure content is accurate, well-formatted, and engaging for the target audience.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Research Task
    research_task = Task(
        description=f"""Research the topic: {topic}
        
        Provide:
        1. Key concepts and definitions
        2. Current trends and developments
        3. Important facts and statistics
        4. Main benefits and challenges
        5. Future outlook
        
        Focus on accuracy and comprehensiveness.""",
        expected_output="""A detailed research report with:
        - Executive summary
        - Key findings
        - Supporting data and facts
        - Trends analysis
        - Recommendations""",
        agent=researcher
    )
    
    # Writing Task
    writing_task = Task(
        description=f"""Based on the research findings, write a comprehensive article about: {topic}
        
        Requirements:
        1. Clear introduction that hooks the reader
        2. Well-organized main content with subheadings
        3. Include key insights from the research
        4. Use engaging language suitable for general audience
        5. Conclude with actionable takeaways
        
        Target length: 800-1200 words""",
        expected_output="""A well-structured article with:
        - Compelling headline
        - Engaging introduction
        - Organized body with subheadings
        - Clear conclusion with key takeaways
        - Professional formatting""",
        agent=writer
    )
    
    # Review Task
    review_task = Task(
        description="""Review the written article and provide final improvements.
        
        Check for:
        1. Content accuracy and completeness
        2. Grammar and readability
        3. Structure and flow
        4. Engagement and clarity
        5. Overall quality
        
        Provide the final polished version.""",
        expected_output="""Final polished article with:
        - Improved content structure
        - Enhanced readability
        - Corrected grammar and style
        - Optimized engagement
        - Professional presentation""",
        agent=reviewer
    )
    
    # Create crew
    crew = Crew(
        agents=[researcher, writer, reviewer],
        tasks=[research_task, writing_task, review_task],
        verbose=True,
        process=Process.sequential
    )
    
    return crew

def run_content_analysis(topic):
    """Run the content analysis crew"""
    try:
        # Create and run the crew
        crew = create_content_crew(topic)
        result = crew.kickoff()
        
        return {
            "success": True,
            "result": str(result),
            "message": "Content analysis completed successfully!"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "An error occurred during content analysis."
        }

# Test function
if __name__ == "__main__":
    # Test with a sample topic
    test_topic = "Artificial Intelligence in Healthcare"
    
    print("Testing CrewAI Content Analysis...")
    result = run_content_analysis(test_topic)
    
    if result["success"]:
        print("✅ Success!")
        print(result["result"])
    else:
        print("❌ Error:")
        print(result["error"])
