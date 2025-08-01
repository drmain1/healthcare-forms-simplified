from pydantic import BaseModel, Field, conlist
from typing import List, Optional, Dict, Any
from datetime import datetime
from .share_link import ShareLink

# Represents a single element in a SurveyJS page (question, panel, etc.)
class FormElement(BaseModel):
    type: str
    name: str
    title: Optional[str] = None
    is_required: Optional[bool] = Field(None, alias='isRequired')
    choices: Optional[List[Any]] = None
    # Mobile optimization properties
    col_count: Optional[int] = Field(None, alias='colCount')  # For radio/checkbox groups
    render_as: Optional[str] = Field(None, alias='renderAs')  # Rendering mode
    max_width: Optional[str] = Field(None, alias='maxWidth')  # Max width constraint
    min_width: Optional[str] = Field(None, alias='minWidth')  # Min width constraint
    source_type: Optional[str] = Field(None, alias='sourceType')  # For file uploads
    mobile_view: Optional[str] = Field(None, alias='mobileView')  # For matrix questions
    start_with_new_line: Optional[bool] = Field(None, alias='startWithNewLine')  # Layout control
    
    class Config:
        extra = 'allow'  # Allow extra fields not explicitly defined

# Represents a single page in a SurveyJS form
class Page(BaseModel):
    name: str
    elements: List[FormElement]

# Represents the main SurveyJS JSON structure
class SurveyJSModel(BaseModel):
    title: str
    description: Optional[str] = None
    pages: conlist(Page, min_length=1)
    # Mobile optimization properties
    width_mode: Optional[str] = Field('responsive', alias='widthMode')  # Default to responsive
    show_question_numbers: Optional[str] = Field('off', alias='showQuestionNumbers')
    mobile_breakpoint: Optional[int] = Field(768, alias='mobileBreakpoint')
    questions_on_page_mode: Optional[str] = Field('standard', alias='questionsOnPageMode')
    
    class Config:
        extra = 'allow'

class Form(BaseModel):
    id: str = Field(..., alias='_id')
    title: str
    description: Optional[str] = None
    survey_json: SurveyJSModel = Field(..., alias='surveyJson')
    created_at: datetime = Field(default_factory=datetime.utcnow, alias='createdAt')
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias='updatedAt')
    created_by: str = Field(..., alias='createdBy')
    updated_by: str = Field(..., alias='updatedBy')
    organization_id: str = Field(..., alias='organizationId')
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_template: bool = Field(False, alias='isTemplate')
    version: int = 1
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        allow_population_by_field_name = True

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    survey_json: SurveyJSModel = Field(..., alias='surveyJson')
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_template: bool = Field(False, alias='isTemplate')

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    survey_json: Optional[SurveyJSModel] = Field(None, alias='surveyJson')
    category: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

class FormListResponse(BaseModel):
    count: int
    results: List[Form]

class PdfProcessRequest(BaseModel):
    pdf_data: str = Field(..., description="Base64-encoded PDF data")
