import { render} from '@testing-library/svelte';
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest';
import TablePagination from '$components/TablePagination.svelte'; 

describe('Pagination', () => {

it('should render pagination controls', () => {
    const { getByLabelText } = render(TablePagination, {
        props: {
            currentPage: 1,
            totalPages: 5
        }
    });

    // Check existence of pagination controls
    expect(getByLabelText('Previous page')).toBeDefined();
    expect(getByLabelText('Next page')).toBeDefined();
    expect(getByLabelText('Current page').textContent).toBe('1');
});

it('should go to the next page when the Next button is clicked', async () => {
    const { getByLabelText} = render(TablePagination, {
        props: {
            currentPage: 1,
            totalPages: 5
        }
    });
    const user = userEvent.setup()

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
            totalPages: 5
        }
    });

    // Next button should be disabled on the last page
    const nextButton = getByLabelText('Next page');
    expect(nextButton.getAttribute('disabled')).toBeDefined();
});

it('should disable Previous button on the first page', async () => {
    const { getByLabelText } = render(TablePagination, {
        props: {
            currentPage: 1,
            totalPages: 5
        }
    });

    // Previous button should be disabled on the first page
    const prevButton = getByLabelText('Previous page');
    expect(prevButton.getAttribute('disabled')).toBeDefined();

});

})