import { FC, useCallback, useEffect, useState } from 'react';
import { Button, Column, Flex, Text } from '../../../common';
import { FurniItem } from '../../../hooks/furni-editor';

interface FurniEditorSearchViewProps
{
    items: FurniItem[];
    total: number;
    page: number;
    loading: boolean;
    onSearch: (query: string, type: string, page: number) => void;
    onSelect: (id: number) => void;
}

export const FurniEditorSearchView: FC<FurniEditorSearchViewProps> = props =>
{
    const { items, total, page, loading, onSearch, onSelect } = props;
    const [ query, setQuery ] = useState('');
    const [ typeFilter, setTypeFilter ] = useState('');

    useEffect(() =>
    {
        onSearch('', '', 1);
    }, []);

    const handleSearch = useCallback(() =>
    {
        onSearch(query, typeFilter, 1);
    }, [ query, typeFilter, onSearch ]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if(e.key === 'Enter') handleSearch();
    }, [ handleSearch ]);

    const totalPages = Math.ceil(total / 20);

    return (
        <Column gap={ 1 } className="h-full">
            <Flex gap={ 1 } alignItems="end">
                <Column gap={ 0 } className="flex-1">
                    <Text small bold>Search</Text>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="ID, name or sprite ID..."
                        value={ query }
                        onChange={ e => setQuery(e.target.value) }
                        onKeyDown={ handleKeyDown }
                    />
                </Column>
                <Column gap={ 0 } className="w-[80px]">
                    <Text small bold>Type</Text>
                    <select
                        className="form-select form-select-sm"
                        value={ typeFilter }
                        onChange={ e => setTypeFilter(e.target.value) }
                    >
                        <option value="">All</option>
                        <option value="s">Floor (s)</option>
                        <option value="i">Wall (i)</option>
                    </select>
                </Column>
                <Button variant="primary" disabled={ loading } onClick={ handleSearch }>
                    { loading ? '...' : 'Search' }
                </Button>
            </Flex>

            <Column gap={ 0 } className="flex-1 overflow-auto border border-[#ccc] rounded bg-white">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-[#e8e8e8] sticky top-0">
                            <th className="px-2 py-1 text-left">ID</th>
                            <th className="px-2 py-1 text-left">Sprite</th>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Public Name</th>
                            <th className="px-2 py-1 text-center">Type</th>
                            <th className="px-2 py-1 text-left">Interaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        { items.map(item => (
                            <tr
                                key={ item.id }
                                className="cursor-pointer hover:bg-[#d4edfa] border-b border-[#eee] transition-colors"
                                onClick={ () => onSelect(item.id) }
                            >
                                <td className="px-2 py-1 font-mono">{ item.id }</td>
                                <td className="px-2 py-1 font-mono">{ item.spriteId }</td>
                                <td className="px-2 py-1 truncate max-w-[120px]">{ item.itemName }</td>
                                <td className="px-2 py-1 truncate max-w-[120px]">{ item.publicName }</td>
                                <td className="px-2 py-1 text-center">
                                    <span className={ `px-1 rounded text-white text-[10px] ${ item.type === 's' ? 'bg-[#1e7295]' : 'bg-[#6b7280]' }` }>
                                        { item.type === 's' ? 'Floor' : 'Wall' }
                                    </span>
                                </td>
                                <td className="px-2 py-1 text-[10px]">{ item.interactionType || '-' }</td>
                            </tr>
                        )) }
                        { items.length === 0 && !loading &&
                            <tr>
                                <td colSpan={ 6 } className="px-2 py-4 text-center text-[#999]">No items found</td>
                            </tr>
                        }
                    </tbody>
                </table>
            </Column>

            { totalPages > 1 &&
                <Flex gap={ 1 } justifyContent="between" alignItems="center">
                    <Text small variant="gray">
                        { total } items - Page { page }/{ totalPages }
                    </Text>
                    <Flex gap={ 1 }>
                        <Button
                            variant="secondary"
                            disabled={ page <= 1 }
                            onClick={ () => onSearch(query, typeFilter, page - 1) }
                        >
                            Prev
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={ page >= totalPages }
                            onClick={ () => onSearch(query, typeFilter, page + 1) }
                        >
                            Next
                        </Button>
                    </Flex>
                </Flex>
            }
        </Column>
    );
};
