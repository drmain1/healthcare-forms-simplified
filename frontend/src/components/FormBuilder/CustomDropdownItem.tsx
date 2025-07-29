import React from 'react';
import { ReactElementFactory } from 'survey-react-ui';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';

interface CustomDropdownItemProps {
  item: any;
  itemComponent?: string;
}

const CustomDropdownItem: React.FC<CustomDropdownItemProps> = ({ item }) => {
  // Get icon based on the field type or value
  const getIcon = () => {
    // For state dropdown
    if (item.iconType === 'state') {
      return <LocationOnIcon sx={{ fontSize: 18, color: '#666', mr: 1 }} />;
    }
    
    // Default icon
    return null;
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: '4px 0'
    }}>
      {getIcon()}
      <span>{item.title || item.text}</span>
    </div>
  );
};

// Register the component for use in SurveyJS
ReactElementFactory.Instance.registerElement(
  'custom-dropdown-item',
  (props: any) => React.createElement(CustomDropdownItem, props)
);

// Create a custom field component with icon
interface CustomFieldWithIconProps {
  item: any;
  question: any;
}

export const CustomFieldWithIcon: React.FC<CustomFieldWithIconProps> = ({ item, question }) => {
  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'first_name':
      case 'last_name':
        return <PersonIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'phone_number':
      case 'secondary_phone':
        return <LocalPhoneIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'date_of_birth':
        return <CalendarTodayIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'email':
        return <EmailIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'street_address':
        return <HomeIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'city':
        return <LocationCityIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      case 'state':
      case 'zip_code':
        return <LocationOnIcon sx={{ fontSize: 20, color: '#666', mr: 1 }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {getFieldIcon(question.name)}
      <div style={{ flex: 1 }}>
        {/* The actual input field will be rendered here by SurveyJS */}
      </div>
    </div>
  );
};

export default CustomDropdownItem;