// components/UI/Header/Header.jsx

import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from "../../../assets/images/logo.webp";
import companyApi from "../../../services/companyApi";

/**
 * A reusable, sticky header component with the logo on the right side.
 * @param {object} props
 * @param {boolean} [props.isHidden=false] - If true, the header will be hidden.
 */
const Header = ({ isHidden = false }) => {
  const [title, setTitle] = useState('BVC');

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const companyData = await companyApi.getCompanyName();
        if (companyData && companyData.company_name) {
          setTitle(companyData.company_name); 
        }
      } catch (error) {
         console.error("Failed to get company name:", error);
      }
    };

    fetchTitle();
  }, []);

  return (
    <header className={`header-section-components ${isHidden ? 'hidden-upi' : ''}`}>
      {/* 
        ITEM 1: The spacer is now on the left.
        Its width matches the logo's width to keep the title centered.
      */}
      <div style={{ width: '44px' }} /> 
      
      {/* ITEM 2: The title remains in the middle. */}
      <h1 className="header-title-components">
        {title}
      </h1>

      {/* 
        ITEM 3: The logo is now the last element, so it will be on the right.
      */}
      <img 
        src={logo}
        alt="Company Logo" 
        className="header-logo-components" 
      />
    </header>
  );
};

export default Header;