"""
Business rules for product availability based on customer type.

Rules:
- Consumer customers can purchase: Basic, Professional
- SMB customers can purchase: Professional, Teams
- Enterprise customers can purchase: Basic, Teams, Ultra-Enterprise
"""

from typing import List, Tuple

# Product availability rules mapping
PRODUCT_AVAILABILITY_RULES = {
    'Consumer': {'Basic', 'Professional'},
    'SMB': {'Professional', 'Teams'},
    'Enterprise': {'Basic', 'Teams', 'Ultra-Enterprise'}
}


def validate_product_for_customer(customer_type: str, product_types: List[str]) -> Tuple[bool, str]:
    """
    Validates if all products are allowed for the given customer type.

    Args:
        customer_type: The type of customer (Consumer, SMB, Enterprise)
        product_types: List of product types to validate

    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if all products are allowed, False otherwise
        - error_message: Empty string if valid, error description if invalid

    Examples:
        >>> validate_product_for_customer('Consumer', ['Basic', 'Professional'])
        (True, '')

        >>> validate_product_for_customer('Consumer', ['Teams'])
        (False, 'Products [Teams] not available for Consumer customers')

        >>> validate_product_for_customer('SMB', ['Professional', 'Basic'])
        (False, 'Products [Basic] not available for SMB customers')
    """
    # Get allowed products for customer type
    allowed_products = PRODUCT_AVAILABILITY_RULES.get(customer_type)

    if not allowed_products:
        return False, f"Invalid customer type: {customer_type}"

    # Check if any products are not allowed
    invalid_products = [pt for pt in product_types if pt not in allowed_products]

    if invalid_products:
        return False, f"Products {invalid_products} not available for {customer_type} customers"

    return True, ""


def get_available_products_for_customer(customer_type: str) -> List[str]:
    """
    Get list of product types available for a customer type.

    Args:
        customer_type: The type of customer (Consumer, SMB, Enterprise)

    Returns:
        List of product types available for the customer type

    Examples:
        >>> get_available_products_for_customer('Consumer')
        ['Basic', 'Professional']

        >>> get_available_products_for_customer('Enterprise')
        ['Basic', 'Teams', 'Ultra-Enterprise']
    """
    allowed_products = PRODUCT_AVAILABILITY_RULES.get(customer_type, set())
    return sorted(list(allowed_products))
