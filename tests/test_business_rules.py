"""
Tests for business rules validation.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from business_rules import validate_product_for_customer, get_available_products_for_customer


def test_consumer_valid_products():
    """Test that Consumer can purchase Basic and Professional"""
    is_valid, msg = validate_product_for_customer('Consumer', ['Basic', 'Professional'])
    assert is_valid is True
    assert msg == ""


def test_consumer_invalid_teams():
    """Test that Consumer cannot purchase Teams"""
    is_valid, msg = validate_product_for_customer('Consumer', ['Teams'])
    assert is_valid is False
    assert 'Teams' in msg


def test_smb_valid_products():
    """Test that SMB can purchase Professional and Teams"""
    is_valid, msg = validate_product_for_customer('SMB', ['Professional', 'Teams'])
    assert is_valid is True
    assert msg == ""


def test_smb_invalid_basic():
    """Test that SMB cannot purchase Basic"""
    is_valid, msg = validate_product_for_customer('SMB', ['Basic'])
    assert is_valid is False
    assert 'Basic' in msg


def test_enterprise_valid_products():
    """Test that Enterprise can purchase Basic, Teams, and Ultra-Enterprise"""
    is_valid, msg = validate_product_for_customer('Enterprise', ['Basic', 'Teams', 'Ultra-Enterprise'])
    assert is_valid is True
    assert msg == ""


def test_enterprise_invalid_professional():
    """Test that Enterprise cannot purchase Professional"""
    is_valid, msg = validate_product_for_customer('Enterprise', ['Professional'])
    assert is_valid is False
    assert 'Professional' in msg


def test_invalid_customer_type():
    """Test invalid customer type"""
    is_valid, msg = validate_product_for_customer('InvalidType', ['Basic'])
    assert is_valid is False
    assert 'Invalid customer type' in msg


def test_get_available_products_consumer():
    """Test getting available products for Consumer"""
    products = get_available_products_for_customer('Consumer')
    assert set(products) == {'Basic', 'Professional'}


def test_get_available_products_smb():
    """Test getting available products for SMB"""
    products = get_available_products_for_customer('SMB')
    assert set(products) == {'Professional', 'Teams'}


def test_get_available_products_enterprise():
    """Test getting available products for Enterprise"""
    products = get_available_products_for_customer('Enterprise')
    assert set(products) == {'Basic', 'Teams', 'Ultra-Enterprise'}
