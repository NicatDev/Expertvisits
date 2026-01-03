
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.scss';
import clsx from 'clsx';

const Pagination = ({ currentPage, totalCount, pageSize, onPageChange, className }) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const onNext = () => {
        onPageChange(currentPage + 1);
    };

    const onPrevious = () => {
        onPageChange(currentPage - 1);
    };

    const DOTS = '...';

    const usePagination = ({
        totalCount,
        pageSize,
        siblingCount = 1,
        currentPage
    }) => {
        // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
        const totalPageNumbers = siblingCount + 5;

        /*
          Case 1:
          If the number of pages is less than the page numbers we want to show in our
          paginationComponent, we return the range [1..totalPages]
        */
        if (totalPageNumbers >= totalPages) {
            const range = [];
            for (let i = 1; i <= totalPages; i++) {
                range.push(i);
            }
            return range;
        }

        /*
            Calculate left and right sibling index and make sure they are within range 1 and totalPages
        */
        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        /*
          We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and totalPages. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPages - 2
        */
        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        /*
            Case 2: No left dots to show, but rights dots to be shown
        */
        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            let leftRange = [];
            for (let i = 1; i <= leftItemCount; i++) leftRange.push(i);

            return [...leftRange, DOTS, totalPages];
        }

        /*
            Case 3: No right dots to show, but left dots to be shown
        */
        if (shouldShowLeftDots && !shouldShowRightDots) {

            let rightItemCount = 3 + 2 * siblingCount;
            let rightRange = [];
            for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) rightRange.push(i);

            return [firstPageIndex, DOTS, ...rightRange];
        }

        /*
            Case 4: Both left and right dots to be shown
        */
        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = [];
            for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) middleRange.push(i);

            return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
        }
    };

    const paginationRange = usePagination({
        currentPage,
        totalCount,
        siblingCount: 1,
        pageSize
    });

    return (
        <ul className={clsx(styles.paginationContainer, className)}>
            <li
                className={clsx(styles.paginationItem, { [styles.disabled]: currentPage === 1 })}
                onClick={currentPage === 1 ? undefined : onPrevious}
            >
                <ChevronLeft size={16} />
                <span className={styles.arrowText}>Previous</span>
            </li>
            {paginationRange?.map((pageNumber, idx) => {
                if (pageNumber === DOTS) {
                    return <li key={idx} className={clsx(styles.paginationItem, styles.dots)}>&#8230;</li>;
                }

                return (
                    <li
                        key={idx}
                        className={clsx(styles.paginationItem, {
                            [styles.selected]: pageNumber === currentPage
                        })}
                        onClick={() => onPageChange(pageNumber)}
                    >
                        {pageNumber}
                    </li>
                );
            })}
            <li
                className={clsx(styles.paginationItem, { [styles.disabled]: currentPage === totalPages })}
                onClick={currentPage === totalPages ? undefined : onNext}
            >
                <span className={styles.arrowText}>Next</span>
                <ChevronRight size={16} />
            </li>
        </ul>
    );
};

export default Pagination;
