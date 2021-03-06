import React from 'react'
import createSagaMiddleware from 'redux-saga'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import rootReducer from './reducers/index.js'
import rootSaga from './sagas/index.js'
import { getLockStatus, getBalance, getTransactions } from './actions/wallet.js'
import WalletApp from './components/app.js'

export const initWallet = () => {
	// Set up saga middleware system
	const sagaMiddleware = createSagaMiddleware()
	const store = createStore(
		rootReducer,
		applyMiddleware(sagaMiddleware)
	)
	sagaMiddleware.run(rootSaga)
	// Get initial UI state
	store.dispatch(getLockStatus())
	store.dispatch(getBalance())
	store.dispatch(getTransactions())

	// Poll Rivined for state changes.
	setInterval(() => {
		store.dispatch(getLockStatus())
		store.dispatch(getBalance())
		store.dispatch(getTransactions())
	}, 5000)
	return (
		<Provider store={store}>
			<WalletApp />
		</Provider>
	)
}
