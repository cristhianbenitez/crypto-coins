import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import coinGecko from 'api/coinGecko';
import { v4 as uuid } from 'uuid';

interface AssetProps {
  coinID: string;
  purchasedAmount: number;
  date: string;
}

interface AssetState {
  assets: {}[];
  marketData: object;
  status: 'idle' | 'succeeded' | 'failed' | 'loading';
  error?: string;
  loading: boolean;
}

const initialState: AssetState = {
  assets: [],
  marketData: {},
  status: 'idle',
  loading: false
};

export const getAssetData = createAsyncThunk(
  'assets/assetData',
  async (asset: AssetProps) => {
    const { coinID, purchasedAmount, date } = asset;
    const purchasedDate = date.split('-').reverse().join('-');
    const { data } = await coinGecko.get(`/coins/${coinID}/history`, {
      params: { date: purchasedDate }
    });
    const uniqueId = uuid().slice(0, 8);
    const historicPriceData = data?.market_data.current_price.usd;
    const { image, name, symbol, id } = data;
    const assetData = {
      uniqueId,
      name,
      symbol,
      id,
      image: image.small,
      purchasedDate,
      purchasedAmount,
      historicPriceData
    };
    return assetData;
  }
);

const assetsListSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    handleRemove: (state, { payload }) => {
      const filteredAssets = Object.assign(state.assets).filter(
        (asset: any) => asset.uniqueId !== payload
      );
      state.assets = filteredAssets;
    }
  },
  extraReducers(builder) {
    builder
      .addCase(getAssetData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getAssetData.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.assets = [...state.assets, payload];
      })
      .addCase(getAssetData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { handleRemove } = assetsListSlice.actions;
export default assetsListSlice.reducer;
