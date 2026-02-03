import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TablePagination } from '$components/table';

describe('Pagination', () => {
  it('should render pagination controls', () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
      },
    });

    // Check existence of pagination controls
    expect(getByLabelText('Previous page')).toBeDefined();
    expect(getByLabelText('Next page')).toBeDefined();
    expect(getByLabelText('Current page').textContent).toBe('1');
  });

  it('should go to the next page when the Next button is clicked', async () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
      },
    });
    const user = userEvent.setup();

    // Check initial state
    expect(getByLabelText('Current page').textContent).toBe('1');

    // Click the next button
    const nextButton = getByLabelText('Next page');
    await user.click(nextButton);

    expect(getByLabelText('Current page').textContent).toBe('2');
  });

  it('should disable Next button on the last page', async () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 5,
        totalPages: 5,
      },
    });

    // Next button should be disabled on the last page
    const nextButton = getByLabelText('Next page');
    expect(nextButton.getAttribute('disabled')).toBeDefined();
  });

  it('should disable Previous button on the first page', async () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
      },
    });

    // Previous button should be disabled on the first page
    const prevButton = getByLabelText('Previous page');
    expect(prevButton.getAttribute('disabled')).toBeDefined();
  });

  it('should go to the first page when First button is clicked', async () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 3,
        totalPages: 5,
      },
    });
    const user = userEvent.setup();

    const firstButton = getByLabelText('First page');
    await user.click(firstButton);

    expect(getByLabelText('Current page').textContent).toBe('1');
  });

  it('should go to the last page when Last button is clicked', async () => {
    const { getByLabelText } = render(TablePagination, {
      props: {
        currentPage: 2,
        totalPages: 5,
      },
    });
    const user = userEvent.setup();

    const lastButton = getByLabelText('Last page');
    await user.click(lastButton);

    expect(getByLabelText('Current page').textContent).toBe('5');
  });

  it('should not render pagination controls when totalPages is 1', () => {
    const { queryByLabelText } = render(TablePagination, {
      props: {
        currentPage: 1,
        totalPages: 1,
      },
    });

    expect(queryByLabelText('Previous page')).toBeNull();
    expect(queryByLabelText('Next page')).toBeNull();
  });
});
