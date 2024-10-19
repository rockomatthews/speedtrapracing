import { useState } from 'react';
import axios from 'axios';

export default function RealNameSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await axios.get(`/api/search-iracing-name?name=${encodeURIComponent(searchTerm)}`);
      setSearchResult(response.data);
    } catch (err) {
      setError('An error occurred while searching. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter a real name"
      />
      <button onClick={handleSearch} disabled={isLoading}>
        Search
      </button>
      {isLoading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {searchResult && (
        <div>
          {searchResult.exists ? (
            <p>{searchResult.name} (ID: {searchResult.id})</p>
          ) : (
            <p>{searchResult.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
