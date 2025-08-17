#!/usr/bin/env python3

from company_categorization import get_company_category

# Test the company categorization
print('Testing company categorization:')
print('Lulus category:', get_company_category('lulus.com'))
print('Amazon category:', get_company_category('amazon.com'))  
print('Nike category:', get_company_category('nike.com'))
print('Sephora category:', get_company_category('sephora.com'))
print('Unknown domain category:', get_company_category('someunknown.com'))

# Test with email format
print('\nTesting with email format:')
print('Email format test:', get_company_category('love@hello.lulus.com'))
