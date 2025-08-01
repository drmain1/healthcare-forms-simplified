"""
Form Mobile Optimizer Service
Validates and optimizes SurveyJS forms for mobile display
"""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class FormMobileOptimizer:
    """Optimizes SurveyJS forms for consistent mobile display"""
    
    @staticmethod
    def optimize_form(form_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize form JSON for mobile display
        
        Args:
            form_json: The SurveyJS form JSON
            
        Returns:
            Optimized form JSON
        """
        # Ensure root properties for mobile
        form_json = FormMobileOptimizer._ensure_root_properties(form_json)
        
        # Process all pages
        if 'pages' in form_json:
            for page in form_json['pages']:
                if 'elements' in page:
                    page['elements'] = FormMobileOptimizer._optimize_elements(page['elements'])
        
        # Process root-level elements if any
        if 'elements' in form_json:
            form_json['elements'] = FormMobileOptimizer._optimize_elements(form_json['elements'])
        
        return form_json
    
    @staticmethod
    def _ensure_root_properties(form_json: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure root form has mobile-optimized properties"""
        
        # Set responsive width mode if not specified
        if 'widthMode' not in form_json:
            form_json['widthMode'] = 'responsive'
            logger.info("Set widthMode to 'responsive'")
        
        # Turn off question numbers for cleaner mobile UI
        if 'showQuestionNumbers' not in form_json:
            form_json['showQuestionNumbers'] = 'off'
            logger.info("Set showQuestionNumbers to 'off'")
        
        # Set mobile breakpoint
        if 'mobileBreakpoint' not in form_json:
            form_json['mobileBreakpoint'] = 768
            
        return form_json
    
    @staticmethod
    def _optimize_elements(elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Optimize individual form elements"""
        
        for element in elements:
            element_type = element.get('type', '')
            
            # Optimize radio groups and checkboxes
            if element_type in ['radiogroup', 'checkbox']:
                # Force single column layout
                if 'colCount' not in element or element.get('colCount', 1) > 0:
                    element['colCount'] = 0
                    logger.info(f"Set colCount to 0 for {element.get('name', 'unnamed')} ({element_type})")
                
                # Remove table rendering mode
                if element.get('renderAs') == 'table':
                    del element['renderAs']
                    logger.info(f"Removed renderAs='table' from {element.get('name', 'unnamed')}")
            
            # Optimize text inputs
            elif element_type in ['text', 'comment']:
                # Set max width to prevent overflow
                if 'maxWidth' not in element:
                    element['maxWidth'] = '100%'
                    logger.info(f"Set maxWidth to 100% for {element.get('name', 'unnamed')}")
            
            # Optimize dropdowns for mobile
            elif element_type == 'dropdown':
                # Force native select rendering on mobile
                element['renderAs'] = 'select'
                logger.info(f"Set renderAs='select' for {element.get('name', 'unnamed')} (native mobile dropdown)")
            
            # Optimize file uploads
            elif element_type == 'file':
                # Ensure camera access on mobile
                if 'sourceType' not in element:
                    element['sourceType'] = 'camera,file-picker'
                    logger.info(f"Set sourceType for {element.get('name', 'unnamed')}")
            
            # Optimize matrix questions
            elif element_type in ['matrix', 'matrixdropdown', 'matrixdynamic']:
                # Set mobile view mode
                if 'mobileView' not in element:
                    element['mobileView'] = 'list'
                    logger.info(f"Set mobileView='list' for {element.get('name', 'unnamed')}")
                
                # Ensure columns don't use multi-column layout
                if 'columnColCount' in element and element['columnColCount'] > 1:
                    element['columnColCount'] = 1
                    logger.info(f"Set columnColCount to 1 for {element.get('name', 'unnamed')}")
            
            # Process nested elements (panels, etc)
            if 'elements' in element:
                element['elements'] = FormMobileOptimizer._optimize_elements(element['elements'])
            
            # Process rows in matrices
            if 'rows' in element and isinstance(element['rows'], list):
                for row in element['rows']:
                    if isinstance(row, dict) and 'elements' in row:
                        row['elements'] = FormMobileOptimizer._optimize_elements(row['elements'])
        
        return elements
    
    @staticmethod
    def validate_mobile_properties(form_json: Dict[str, Any]) -> List[str]:
        """
        Validate that form has proper mobile properties
        
        Returns:
            List of validation warnings
        """
        warnings = []
        
        # Check root properties
        if form_json.get('widthMode') != 'responsive':
            warnings.append("Form widthMode should be 'responsive' for mobile optimization")
        
        # Check all elements
        def check_element(element: Dict[str, Any], path: str = ''):
            element_type = element.get('type', '')
            name = element.get('name', 'unnamed')
            element_path = f"{path}/{name}" if path else name
            
            # Check radio/checkbox groups
            if element_type in ['radiogroup', 'checkbox']:
                col_count = element.get('colCount', 1)
                if col_count > 1:
                    warnings.append(f"{element_path}: colCount={col_count} may cause alignment issues on mobile")
                
                if element.get('renderAs') == 'table':
                    warnings.append(f"{element_path}: renderAs='table' causes layout issues on mobile")
            
            # Check file uploads
            elif element_type == 'file':
                if 'sourceType' not in element or 'camera' not in element.get('sourceType', ''):
                    warnings.append(f"{element_path}: File upload should include 'camera' in sourceType for mobile")
            
            # Check nested elements
            if 'elements' in element:
                for nested in element['elements']:
                    check_element(nested, element_path)
        
        # Process all pages
        if 'pages' in form_json:
            for page in form_json['pages']:
                if 'elements' in page:
                    for element in page['elements']:
                        check_element(element, f"page:{page.get('name', 'unnamed')}")
        
        # Process root elements
        if 'elements' in form_json:
            for element in form_json['elements']:
                check_element(element)
        
        return warnings

# Create singleton instance
form_mobile_optimizer = FormMobileOptimizer()