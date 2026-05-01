import { NextPage } from 'next';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Props {
  page: number;
  setPage: (p: number) => void;
  lastPage?: number;
  scrollOnChange?: boolean;
  tableRef?: RefObject<HTMLDivElement | null>;
  variant?: 'normal' | 'simple',
  limit?: number
  setLimit?: (p: number) => void;
  total?: number
}
const getVisiblePages = (
  current: number,
  total: number,
): (number | '...')[] => {
  if (total <= 1) return [1];
  if (total <= 5) return [...Array(total)].map((_, i) => i + 1);

  const pages: (number | '...')[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }
  const middlePages = [current - 1, current, current + 1].filter(
    (page) => page > 1 && page < total,
  );

  pages.push(...middlePages);
  if (current < total - 2) {
    pages.push('...');
  }
  pages.push(total);

  return pages;
};

export const DataPagination: NextPage<Props> = ({
  page,
  setPage,
  lastPage = 1,
  scrollOnChange = true,
  tableRef,
  variant,
  limit, setLimit, total
}) => {
  const pages = getVisiblePages(page, lastPage);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; // Skip the first render
      return;
    }
    if (scrollOnChange && tableRef?.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [page, scrollOnChange, tableRef]);
  const fromEntry = limit ? total === 0 ? 0 : (page - 1) * limit + 1 : 0;
  const toEntry = (limit && total) ? Math.min(page * limit, total) : 0;
  return <div className="flex items-center justify-between max-md:flex-col max-md:space-y-4 md:flex-row md:space-y-0">
    {limit && (
      <div className="flex items-center justify-center space-x-2">
        {setLimit && <Select
          value={limit.toString()}
          onValueChange={(val) => setLimit(Number(val))}
        >
          <SelectTrigger size='sm'>
            <SelectValue className="" />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 25, 50, 100, 200, 500].map((val) => (
              <SelectItem key={val} value={val.toString()}>
                {val}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>}


        <p className='text-[10px]'>
          Showing {fromEntry} to {toEntry} of {total} entries
        </p>
      </div>
    )}

    {/* Pagination */}
    {setPage && (
      <div className="datatable-pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                showText={variant == 'normal'}
              />
            </PaginationItem>

            {pages.map((p, idx) =>
              p === '...' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(Math.min(lastPage, page + 1))}
                aria-disabled={page === lastPage}
                showText={variant == 'normal'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )}
  </div>
};
