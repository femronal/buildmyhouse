import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CHOOSE_CATEGORY_LABEL, VendorCategoryField } from './VendorCategoryField';

const options = [
  { slug: 'cement', label: 'Cement' },
  { slug: 'roofing-sheets', label: 'Roofing sheets' },
];

describe('vendor manage category control', () => {
  it('shows Choose a category selected, not Cement, when the vendor has no offering', async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <VendorCategoryField value="" options={options} onChange={() => undefined} />,
      );
    });
    const choose = tree!.root.findByProps({ accessibilityLabel: CHOOSE_CATEGORY_LABEL });
    const cement = tree!.root.findByProps({ accessibilityLabel: 'Cement' });
    expect(choose.props.accessibilityState.selected).toBe(true);
    expect(cement.props.accessibilityState.selected).toBe(false);
  });
});
