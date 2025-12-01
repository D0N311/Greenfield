import useStore from "../stores/useStore";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

function Counter() {
  const { count, increment, decrement, reset } = useStore();

  return (
    <>
      {/* Navigation */}
      <Navigation />
      <div className="min-h-screen pt-20 p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Services
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            This page uses Zustand for state management demonstration.
          </p>
          <div className="mt-8 space-y-6">
            <div className="text-3xl font-semibold text-black">Count: {count}</div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={increment}
                className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all font-semibold"
              >
                Increment
              </button>
              <button
                onClick={decrement}
                className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all font-semibold"
              >
                Decrement
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Footer */}
      <Footer />
    </>
  );
}

export default Counter;

